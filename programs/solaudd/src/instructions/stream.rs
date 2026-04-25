use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::StreamAccount;
use crate::errors::SolAuddError;

// ── CREATE STREAM ─────────────────────────────────────────────────
#[derive(Accounts)]
#[instruction(amount_per_sec: u64, duration_secs: i64)]
pub struct CreateStream<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,

    /// CHECK: recipient pubkey stored in state
    pub recipient: AccountInfo<'info>,

    #[account(
        init,
        payer = sender,
        space = StreamAccount::LEN,
        seeds = [
            b"stream",
            sender.key().as_ref(),
            recipient.key().as_ref(),
        ],
        bump
    )]
    pub stream_account: Account<'info, StreamAccount>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = sender,
    )]
    pub sender_ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = sender,
        associated_token::mint = mint,
        associated_token::authority = stream_account,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    pub token_program:            Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program:           Program<'info, System>,
}

pub fn create_stream(
    ctx: Context<CreateStream>,
    amount_per_sec: u64,
    duration_secs: i64,
) -> Result<()> {
    require!(amount_per_sec > 0, SolAuddError::InvalidAmount);
    require!(duration_secs > 0, SolAuddError::InvalidDuration);

    let total_amount = amount_per_sec
        .checked_mul(duration_secs as u64)
        .ok_or(SolAuddError::MathOverflow)?;

    require!(
        ctx.accounts.sender_ata.amount >= total_amount,
        SolAuddError::InsufficientFunds
    );

    let clock = Clock::get()?;
    let stream = &mut ctx.accounts.stream_account;

    stream.sender         = ctx.accounts.sender.key();
    stream.recipient      = ctx.accounts.recipient.key();
    stream.mint           = ctx.accounts.mint.key();
    stream.amount_per_sec = amount_per_sec;
    stream.start_time     = clock.unix_timestamp;
    stream.end_time       = clock.unix_timestamp + duration_secs;
    stream.withdrawn      = 0;
    stream.is_cancelled   = false;
    stream.bump           = ctx.bumps.stream_account;

    // Transfer total AUDD → vault
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from:      ctx.accounts.sender_ata.to_account_info(),
            to:        ctx.accounts.vault_ata.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, total_amount)?;

    msg!(
        "Stream created: {} AUDD/sec for {} secs",
        amount_per_sec,
        duration_secs
    );

    Ok(())
}

// ── WITHDRAW STREAM ───────────────────────────────────────────────
#[derive(Accounts)]
pub struct WithdrawStream<'info> {
    #[account(mut)]
    pub recipient: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"stream",
            stream_account.sender.as_ref(),
            recipient.key().as_ref(),
        ],
        bump = stream_account.bump,
        constraint = stream_account.recipient == recipient.key()
            @ SolAuddError::WrongRecipient,
        constraint = !stream_account.is_cancelled
            @ SolAuddError::StreamCancelled,
    )]
    pub stream_account: Account<'info, StreamAccount>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = stream_account,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = recipient,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub recipient_ata: Account<'info, TokenAccount>,

    pub token_program:            Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program:           Program<'info, System>,
}

pub fn withdraw_stream(ctx: Context<WithdrawStream>) -> Result<()> {
    let clock  = Clock::get()?;
    let stream = &ctx.accounts.stream_account;

    // Calculate how much is claimable
    let elapsed = clock.unix_timestamp
        .min(stream.end_time)
        .saturating_sub(stream.start_time) as u64;

    let earned = stream.amount_per_sec
        .checked_mul(elapsed)
        .ok_or(SolAuddError::MathOverflow)?;

    let claimable = earned.saturating_sub(stream.withdrawn);

    require!(claimable > 0, SolAuddError::NothingToWithdraw);

    // PDA signer seeds
    let sender_key    = stream.sender;
    let recipient_key = stream.recipient;
    let bump          = stream.bump;

    let seeds: &[&[&[u8]]] = &[&[
        b"stream",
        sender_key.as_ref(),
        recipient_key.as_ref(),
        &[bump],
    ]];

    // Transfer claimable AUDD → recipient
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from:      ctx.accounts.vault_ata.to_account_info(),
            to:        ctx.accounts.recipient_ata.to_account_info(),
            authority: ctx.accounts.stream_account.to_account_info(),
        },
        seeds,
    );
    token::transfer(cpi_ctx, claimable)?;

    ctx.accounts.stream_account.withdrawn += claimable;

    msg!("Stream withdrawal: {} AUDD claimed", claimable);

    Ok(())
}

// ── CANCEL STREAM ─────────────────────────────────────────────────
#[derive(Accounts)]
pub struct CancelStream<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"stream",
            sender.key().as_ref(),
            stream_account.recipient.as_ref(),
        ],
        bump = stream_account.bump,
        constraint = stream_account.sender == sender.key()
            @ SolAuddError::Unauthorized,
        constraint = !stream_account.is_cancelled
            @ SolAuddError::StreamCancelled,
    )]
    pub stream_account: Account<'info, StreamAccount>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = stream_account,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = sender,
    )]
    pub sender_ata: Account<'info, TokenAccount>,

    /// CHECK: recipient ATA for earned portion
    #[account(mut)]
    pub recipient_ata: Account<'info, TokenAccount>,

    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn cancel_stream(ctx: Context<CancelStream>) -> Result<()> {
    let clock  = Clock::get()?;
    let stream = &ctx.accounts.stream_account;

    // Calculate earned so far
    let elapsed = clock.unix_timestamp
        .min(stream.end_time)
        .saturating_sub(stream.start_time) as u64;

    let earned    = stream.amount_per_sec
        .checked_mul(elapsed)
        .ok_or(SolAuddError::MathOverflow)?;

    let claimable = earned.saturating_sub(stream.withdrawn);

    let total_amount = stream.amount_per_sec
        .checked_mul(
            (stream.end_time - stream.start_time) as u64
        )
        .ok_or(SolAuddError::MathOverflow)?;

    let refund = total_amount
        .saturating_sub(earned);

    let sender_key    = stream.sender;
    let recipient_key = stream.recipient;
    let bump          = stream.bump;

    let seeds: &[&[&[u8]]] = &[&[
        b"stream",
        sender_key.as_ref(),
        recipient_key.as_ref(),
        &[bump],
    ]];

    // Send earned portion to recipient
    if claimable > 0 {
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from:      ctx.accounts.vault_ata.to_account_info(),
                to:        ctx.accounts.recipient_ata.to_account_info(),
                authority: ctx.accounts.stream_account.to_account_info(),
            },
            seeds,
        );
        token::transfer(cpi_ctx, claimable)?;
    }

    // Refund remaining to sender
    if refund > 0 {
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from:      ctx.accounts.vault_ata.to_account_info(),
                to:        ctx.accounts.sender_ata.to_account_info(),
                authority: ctx.accounts.stream_account.to_account_info(),
            },
            seeds,
        );
        token::transfer(cpi_ctx, refund)?;
    }

    ctx.accounts.stream_account.is_cancelled = true;

    msg!(
        "Stream cancelled: {} to recipient, {} refunded",
        claimable,
        refund
    );

    Ok(())
}