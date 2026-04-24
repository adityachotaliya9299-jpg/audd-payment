use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::TreasuryAccount;

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
    #[account(init_if_needed, payer = authority, associated_token::mint = mint, associated_token::authority = treasury_account)]
    pub treasury_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
pub fn init_treasury(_ctx: Context<InitTreasury>, _name: String) -> Result<()> { Ok(()) }

#[derive(Accounts)]
pub struct DepositTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub treasury_account: Account<'info, TreasuryAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut, associated_token::mint = mint, associated_token::authority = authority)]
    pub authority_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
pub fn deposit_treasury(_ctx: Context<DepositTreasury>, _amount: u64) -> Result<()> { Ok(()) }

#[derive(Accounts)]
pub struct ExecutePayment<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub treasury_account: Account<'info, TreasuryAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub treasury_ata: Account<'info, TokenAccount>,
    #[account(init_if_needed, payer = authority, associated_token::mint = mint, associated_token::authority = recipient)]
    pub recipient_ata: Account<'info, TokenAccount>,
    /// CHECK: recipient pubkey only
    pub recipient: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
pub fn execute_payment(_ctx: Context<ExecutePayment>, _amount: u64, _memo: String) -> Result<()> { Ok(()) }
