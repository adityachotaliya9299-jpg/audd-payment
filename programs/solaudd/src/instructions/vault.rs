use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::VaultAccount;

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
    #[account(init_if_needed, payer = merchant, associated_token::mint = mint, associated_token::authority = vault_account)]
    pub vault_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
pub fn init_vault(_ctx: Context<InitVault>, _merchant_id: String) -> Result<()> { Ok(()) }

#[derive(Accounts)]
pub struct ReceivePayment<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub vault_account: Account<'info, VaultAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut, associated_token::mint = mint, associated_token::authority = payer)]
    pub payer_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
pub fn receive_payment(_ctx: Context<ReceivePayment>, _amount: u64) -> Result<()> { Ok(()) }

#[derive(Accounts)]
pub struct WithdrawVault<'info> {
    #[account(mut)]
    pub merchant: Signer<'info>,
    #[account(mut)]
    pub vault_account: Account<'info, VaultAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub vault_ata: Account<'info, TokenAccount>,
    #[account(init_if_needed, payer = merchant, associated_token::mint = mint, associated_token::authority = merchant)]
    pub merchant_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
pub fn withdraw_vault(_ctx: Context<WithdrawVault>, _amount: u64) -> Result<()> { Ok(()) }