use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::EscrowAccount;
use crate::errors::SolAuddError;

// ── CreateEscrow ──────────────────────────────────────────────────
#[derive(Accounts)]
#[instruction(amount: u64, release_time: i64, recipient: Pubkey)]
pub struct CreateEscrow<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        init,
        payer = depositor,
        space = EscrowAccount::LEN,
        seeds = [b"escrow", depositor.key().as_ref(), recipient.as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = depositor
    )]
    pub depositor_ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = depositor,
        associated_token::mint = mint,
        associated_token::authority = escrow_account
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    pub token_program:            Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program:           Program<'info, System>,
}

pub fn create_escrow(
    _ctx: Context<CreateEscrow>,
    _amount: u64,
    _release_time: i64,
    _recipient: Pubkey,
) -> Result<()> {
    
    Ok(())
}

// ── ReleaseEscrow ─────────────────────────────────────────────────
#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    #[account(mut)]
    pub recipient: Signer<'info>,

    #[account(mut)]
    pub escrow_account: Account<'info, EscrowAccount>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub vault_ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = recipient,
        associated_token::mint = mint,
        associated_token::authority = recipient
    )]
    pub recipient_ata: Account<'info, TokenAccount>,

    pub token_program:            Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program:           Program<'info, System>,
}

pub fn release_escrow(_ctx: Context<ReleaseEscrow>) -> Result<()> {
    Ok(())
}

// ── RefundEscrow ──────────────────────────────────────────────────
#[derive(Accounts)]
pub struct RefundEscrow<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(mut)]
    pub escrow_account: Account<'info, EscrowAccount>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub vault_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub depositor_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn refund_escrow(_ctx: Context<RefundEscrow>) -> Result<()> {
    Ok(())
}