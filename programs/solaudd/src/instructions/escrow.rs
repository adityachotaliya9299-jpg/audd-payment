use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::EscrowAccount;
use crate::errors::SolAuddError;

// ── CREATE ESCROW ─────────────────────────────────────────────────
#[derive(Accounts)]
#[instruction(amount: u64, release_time: i64, recipient: Pubkey)]
pub struct CreateEscrow<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        init,
        payer = depositor,
        space = EscrowAccount::LEN,
        seeds = [
            b"escrow",
            depositor.key().as_ref(),
            recipient.as_ref(),
        ],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = depositor,
    )]
    pub depositor_ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = depositor,
        associated_token::mint = mint,
        associated_token::authority = escrow_account,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    pub token_program:            Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program:           Program<'info, System>,
}

pub fn create_escrow(
    ctx: Context<CreateEscrow>,
    amount: u64,
    release_time: i64,
    recipient: Pubkey,
) -> Result<()> {
    require!(amount > 0, SolAuddError::InvalidAmount);
    require!(
        ctx.accounts.depositor_ata.amount >= amount,
        SolAuddError::InsufficientFunds
    );

    let escrow = &mut ctx.accounts.escrow_account;
    escrow.depositor    = ctx.accounts.depositor.key();
    escrow.recipient    = recipient;
    escrow.mint         = ctx.accounts.mint.key();
    escrow.amount       = amount;
    escrow.release_time = release_time;
    escrow.is_released  = false;
    escrow.is_refunded  = false;
    escrow.bump         = ctx.bumps.escrow_account;

    // Transfer AUDD from depositor → vault PDA
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from:      ctx.accounts.depositor_ata.to_account_info(),
            to:        ctx.accounts.vault_ata.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, amount)?;

    msg!(
        "Escrow created: {} AUDD locked for {}",
        amount,
        recipient
    );

    Ok(())
}

// ── RELEASE ESCROW ────────────────────────────────────────────────
#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    #[account(mut)]
    pub recipient: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"escrow",
            escrow_account.depositor.as_ref(),
            recipient.key().as_ref(),
        ],
        bump = escrow_account.bump,
        constraint = escrow_account.recipient == recipient.key()
            @ SolAuddError::WrongRecipient,
        constraint = !escrow_account.is_released
            @ SolAuddError::AlreadyReleased,
        constraint = !escrow_account.is_refunded
            @ SolAuddError::AlreadyRefunded,
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = escrow_account,
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

pub fn release_escrow(ctx: Context<ReleaseEscrow>) -> Result<()> {
    let escrow = &ctx.accounts.escrow_account;

    // Check time lock
    let clock = Clock::get()?;
    require!(
        clock.unix_timestamp >= escrow.release_time,
        SolAuddError::TooEarly
    );

    let amount = escrow.amount;

    // PDA signer seeds
    let depositor_key = escrow.depositor;
    let recipient_key = escrow.recipient;
    let bump          = escrow.bump;

    let seeds: &[&[&[u8]]] = &[&[
        b"escrow",
        depositor_key.as_ref(),
        recipient_key.as_ref(),
        &[bump],
    ]];

    // Transfer AUDD from vault → recipient
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from:      ctx.accounts.vault_ata.to_account_info(),
            to:        ctx.accounts.recipient_ata.to_account_info(),
            authority: ctx.accounts.escrow_account.to_account_info(),
        },
        seeds,
    );
    token::transfer(cpi_ctx, amount)?;

    // Mark as released
    ctx.accounts.escrow_account.is_released = true;

    msg!("Escrow released: {} AUDD sent to {}", amount, recipient_key);

    Ok(())
}

// ── REFUND ESCROW ─────────────────────────────────────────────────
#[derive(Accounts)]
pub struct RefundEscrow<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"escrow",
            depositor.key().as_ref(),
            escrow_account.recipient.as_ref(),
        ],
        bump = escrow_account.bump,
        constraint = escrow_account.depositor == depositor.key()
            @ SolAuddError::Unauthorized,
        constraint = !escrow_account.is_released
            @ SolAuddError::AlreadyReleased,
        constraint = !escrow_account.is_refunded
            @ SolAuddError::AlreadyRefunded,
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = escrow_account,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = depositor,
    )]
    pub depositor_ata: Account<'info, TokenAccount>,

    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn refund_escrow(ctx: Context<RefundEscrow>) -> Result<()> {
    let escrow = &ctx.accounts.escrow_account;

    // Depositor can only refund BEFORE release time
    let clock = Clock::get()?;
    require!(
        clock.unix_timestamp < escrow.release_time,
        SolAuddError::RefundWindowClosed
    );

    let amount        = escrow.amount;
    let depositor_key = escrow.depositor;
    let recipient_key = escrow.recipient;
    let bump          = escrow.bump;

    let seeds: &[&[&[u8]]] = &[&[
        b"escrow",
        depositor_key.as_ref(),
        recipient_key.as_ref(),
        &[bump],
    ]];

    // Transfer AUDD from vault → depositor
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from:      ctx.accounts.vault_ata.to_account_info(),
            to:        ctx.accounts.depositor_ata.to_account_info(),
            authority: ctx.accounts.escrow_account.to_account_info(),
        },
        seeds,
    );
    token::transfer(cpi_ctx, amount)?;

    ctx.accounts.escrow_account.is_refunded = true;

    msg!("Escrow refunded: {} AUDD returned to {}", amount, depositor_key);

    Ok(())
}