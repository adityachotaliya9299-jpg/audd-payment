use anchor_lang::prelude::*;

pub mod errors;
pub mod state;
pub mod instructions;

use instructions::escrow::*;
use instructions::stream::*;
use instructions::vault::*;
use instructions::treasury::*;


declare_id!("HHawtfSVhJ1hzRLewqquN6wUFTqhdfcZV2q35fqHermq");

#[program]
pub mod solaudd {
    use super::*;

    // ── PaymentEscrow ─────────────────────────────────────────────
    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        amount: u64,
        release_time: i64,
        recipient: Pubkey,
    ) -> Result<()> {
        instructions::escrow::create_escrow(ctx, amount, release_time, recipient)
    }

    pub fn release_escrow(ctx: Context<ReleaseEscrow>) -> Result<()> {
        instructions::escrow::release_escrow(ctx)
    }

    pub fn refund_escrow(ctx: Context<RefundEscrow>) -> Result<()> {
        instructions::escrow::refund_escrow(ctx)
    }

    // ── StreamPayment ─────────────────────────────────────────────
    pub fn create_stream(
        ctx: Context<CreateStream>,
        amount_per_sec: u64,
        duration_secs: i64,
    ) -> Result<()> {
        instructions::stream::create_stream(ctx, amount_per_sec, duration_secs)
    }

    pub fn withdraw_stream(ctx: Context<WithdrawStream>) -> Result<()> {
        instructions::stream::withdraw_stream(ctx)
    }

    pub fn cancel_stream(ctx: Context<CancelStream>) -> Result<()> {
        instructions::stream::cancel_stream(ctx)
    }

    // ── MerchantVault ─────────────────────────────────────────────
    pub fn init_vault(ctx: Context<InitVault>, merchant_id: String) -> Result<()> {
        instructions::vault::init_vault(ctx, merchant_id)
    }

    pub fn receive_payment(ctx: Context<ReceivePayment>, amount: u64) -> Result<()> {
        instructions::vault::receive_payment(ctx, amount)
    }

    pub fn withdraw_vault(ctx: Context<WithdrawVault>, amount: u64) -> Result<()> {
        instructions::vault::withdraw_vault(ctx, amount)
    }

    // ── TreasuryManager ───────────────────────────────────────────
    pub fn init_treasury(ctx: Context<InitTreasury>, name: String) -> Result<()> {
        instructions::treasury::init_treasury(ctx, name)
    }

    pub fn deposit_treasury(ctx: Context<DepositTreasury>, amount: u64) -> Result<()> {
        instructions::treasury::deposit_treasury(ctx, amount)
    }

    pub fn execute_payment_treasury(
        ctx: Context<ExecutePayment>,
        amount: u64,
        memo: String,
    ) -> Result<()> {
        instructions::treasury::execute_payment(ctx, amount, memo)
    }
}