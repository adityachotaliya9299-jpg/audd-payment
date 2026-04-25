use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::VaultAccount;
use crate::errors::SolAuddError;

// ── INIT VAULT ────────────────────────────────────────────────────
#[derive(Accounts)]
#[instruction(merchant_id: String)]
pub struct InitVault<'info> {
    #[account(mut)]
    pub merchant: Signer<'info>,

    #[account(
        init,
        payer = merchant,
        space = VaultAccount::LEN,
        seeds = [b"vault", merchant.key().as_ref()],
        bump
    )]
    pub vault_account: Account<'info, VaultAccount>,

    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = merchant,
        associated_token::mint = mint,
        associated_token::authority = vault_account,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    pub token_program:            Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program:           Program<'info, System>,
}

pub fn init_vault(
    ctx: Context<InitVault>,
    merchant_id: String,
) -> Result<()> {
    require!(
        merchant_id.len() <= 32,
        SolAuddError::InvalidMerchantId
    );

    let vault = &mut ctx.accounts.vault_account;
    vault.merchant        = ctx.accounts.merchant.key();
    vault.mint            = ctx.accounts.mint.key();
    vault.merchant_id     = merchant_id.clone();
    vault.total_received  = 0;
    vault.bump            = ctx.bumps.vault_account;

    msg!("Vault initialized for merchant: {}", merchant_id);
    Ok(())
}

// ── RECEIVE PAYMENT ───────────────────────────────────────────────
#[derive(Accounts)]
pub struct ReceivePayment<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault_account.merchant.as_ref()],
        bump = vault_account.bump,
    )]
    pub vault_account: Account<'info, VaultAccount>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub payer_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = vault_account,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn receive_payment(
    ctx: Context<ReceivePayment>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, SolAuddError::InvalidAmount);
    require!(
        ctx.accounts.payer_ata.amount >= amount,
        SolAuddError::InsufficientFunds
    );

    // Transfer AUDD from payer → vault
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from:      ctx.accounts.payer_ata.to_account_info(),
            to:        ctx.accounts.vault_ata.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, amount)?;

    ctx.accounts.vault_account.total_received += amount;

    msg!(
        "Payment received: {} AUDD to merchant vault",
        amount
    );
    Ok(())
}

// ── WITHDRAW VAULT ────────────────────────────────────────────────
#[derive(Accounts)]
pub struct WithdrawVault<'info> {
    #[account(mut)]
    pub merchant: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", merchant.key().as_ref()],
        bump = vault_account.bump,
        constraint = vault_account.merchant == merchant.key()
            @ SolAuddError::Unauthorized,
    )]
    pub vault_account: Account<'info, VaultAccount>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = vault_account,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = merchant,
        associated_token::mint = mint,
        associated_token::authority = merchant,
    )]
    pub merchant_ata: Account<'info, TokenAccount>,

    pub token_program:            Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program:           Program<'info, System>,
}

pub fn withdraw_vault(
    ctx: Context<WithdrawVault>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, SolAuddError::InvalidAmount);
    require!(
        ctx.accounts.vault_ata.amount >= amount,
        SolAuddError::InsufficientFunds
    );

    let merchant_key = ctx.accounts.vault_account.merchant;
    let bump         = ctx.accounts.vault_account.bump;

    let seeds: &[&[&[u8]]] = &[&[
        b"vault",
        merchant_key.as_ref(),
        &[bump],
    ]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from:      ctx.accounts.vault_ata.to_account_info(),
            to:        ctx.accounts.merchant_ata.to_account_info(),
            authority: ctx.accounts.vault_account.to_account_info(),
        },
        seeds,
    );
    token::transfer(cpi_ctx, amount)?;

    msg!("Vault withdrawal: {} AUDD to merchant", amount);
    Ok(())
}