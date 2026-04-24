use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::StreamAccount;

#[derive(Accounts)]
pub struct CreateStream<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,
    #[account(
        init,
        payer = sender,
        space = StreamAccount::LEN,
        seeds = [b"stream", sender.key().as_ref(), recipient.key().as_ref()],
        bump
    )]
    pub stream_account: Account<'info, StreamAccount>,
    /// CHECK: recipient pubkey only
    pub recipient: AccountInfo<'info>,
    pub mint: Account<'info, Mint>,
    #[account(mut, associated_token::mint = mint, associated_token::authority = sender)]
    pub sender_ata: Account<'info, TokenAccount>,
    #[account(init_if_needed, payer = sender, associated_token::mint = mint, associated_token::authority = stream_account)]
    pub vault_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
pub fn create_stream(_ctx: Context<CreateStream>, _amount_per_sec: u64, _duration_secs: i64) -> Result<()> { Ok(()) }

#[derive(Accounts)]
pub struct WithdrawStream<'info> {
    #[account(mut)]
    pub recipient: Signer<'info>,
    #[account(mut)]
    pub stream_account: Account<'info, StreamAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub vault_ata: Account<'info, TokenAccount>,
    #[account(init_if_needed, payer = recipient, associated_token::mint = mint, associated_token::authority = recipient)]
    pub recipient_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
pub fn withdraw_stream(_ctx: Context<WithdrawStream>) -> Result<()> { Ok(()) }

#[derive(Accounts)]
pub struct CancelStream<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,
    #[account(mut)]
    pub stream_account: Account<'info, StreamAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub vault_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub sender_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
pub fn cancel_stream(_ctx: Context<CancelStream>) -> Result<()> { Ok(()) }
