use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::TreasuryAccount;
use crate::errors::SolAuddError;

// ── INIT TREASURY ─────────────────────────────────────────────────
#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = TreasuryAccount::LEN,
        seeds = [b"treasury", authority.key().as_ref()],
        bump
    )]
    pub treasury_account: Account<'info, TreasuryAccount>,

    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = treasury_account,
    )]
    pub treasury_ata: Account<'info, TokenAccount>,

    pub token_program:            Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program:           Program<'info, System>,
}

pub fn init_treasury(
    ctx: Context<InitTreasury>,
    name: String,
) -> Result<()> {
    require!(name.len() <= 32, SolAuddError::NameTooLong);

    let treasury       = &mut ctx.accounts.treasury_account;
    treasury.authority = ctx.accounts.authority.key();
    treasury.mint      = ctx.accounts.mint.key();
    treasury.name      = name.clone();
    treasury.total_in  = 0;
    treasury.total_out = 0;
    treasury.bump      = ctx.bumps.treasury_account;

    msg!("Treasury initialized: {}", name);
    Ok(())
}

// ── DEPOSIT TREASURY ──────────────────────────────────────────────
#[derive(Accounts)]
pub struct DepositTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"treasury", authority.key().as_ref()],
        bump = treasury_account.bump,
        constraint = treasury_account.authority == authority.key()
            @ SolAuddError::Unauthorized,
    )]
    pub treasury_account: Account<'info, TreasuryAccount>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub authority_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = treasury_account,
    )]
    pub treasury_ata: Account<'info, TokenAccount>,

    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn deposit_treasury(
    ctx: Context<DepositTreasury>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, SolAuddError::InvalidAmount);
    require!(
        ctx.accounts.authority_ata.amount >= amount,
        SolAuddError::InsufficientFunds
    );

    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from:      ctx.accounts.authority_ata.to_account_info(),
            to:        ctx.accounts.treasury_ata.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, amount)?;

    ctx.accounts.treasury_account.total_in += amount;

    msg!("Treasury deposit: {} AUDD", amount);
    Ok(())
}

// ── EXECUTE PAYMENT ───────────────────────────────────────────────
#[derive(Accounts)]
pub struct ExecutePayment<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"treasury", authority.key().as_ref()],
        bump = treasury_account.bump,
        constraint = treasury_account.authority == authority.key()
            @ SolAuddError::Unauthorized,
    )]
    pub treasury_account: Account<'info, TreasuryAccount>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = treasury_account,
    )]
    pub treasury_ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub recipient_ata: Account<'info, TokenAccount>,

    /// CHECK: recipient pubkey only
    pub recipient: AccountInfo<'info>,

    pub token_program:            Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program:           Program<'info, System>,
}

pub fn execute_payment(
    ctx: Context<ExecutePayment>,
    amount: u64,
    memo: String,
) -> Result<()> {
    require!(amount > 0, SolAuddError::InvalidAmount);
    require!(memo.len() <= 64, SolAuddError::MemoTooLong);
    require!(
        ctx.accounts.treasury_ata.amount >= amount,
        SolAuddError::InsufficientFunds
    );

    let authority_key = ctx.accounts.treasury_account.authority;
    let bump          = ctx.accounts.treasury_account.bump;

    let seeds: &[&[&[u8]]] = &[&[
        b"treasury",
        authority_key.as_ref(),
        &[bump],
    ]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from:      ctx.accounts.treasury_ata.to_account_info(),
            to:        ctx.accounts.recipient_ata.to_account_info(),
            authority: ctx.accounts.treasury_account.to_account_info(),
        },
        seeds,
    );
    token::transfer(cpi_ctx, amount)?;

    ctx.accounts.treasury_account.total_out += amount;

    msg!("Treasury payment: {} AUDD — {}", amount, memo);
    Ok(())
}