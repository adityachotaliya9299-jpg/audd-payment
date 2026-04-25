use anchor_lang::prelude::*;

#[error_code]
pub enum SolAuddError {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,

    #[msg("Insufficient AUDD balance")]
    InsufficientFunds,

    #[msg("Release time has not passed yet")]
    TooEarly,

    #[msg("Only the depositor can perform this action")]
    Unauthorized,

    #[msg("Only the recipient can release funds")]
    WrongRecipient,

    #[msg("Escrow has already been released")]
    AlreadyReleased,

    #[msg("Escrow has already been refunded")]
    AlreadyRefunded,

    #[msg("Refund window has closed — release time has passed")]
    RefundWindowClosed,

    #[msg("Stream has ended")]
    StreamEnded,

    #[msg("Stream has been cancelled")]
    StreamCancelled,

    #[msg("Nothing to withdraw yet")]
    NothingToWithdraw,

    #[msg("Treasury name too long (max 32 chars)")]
    NameTooLong,

    #[msg("Memo too long (max 64 chars)")]
    MemoTooLong,

    #[msg("Invalid merchant ID")]
    InvalidMerchantId,

    #[msg("Duration must be greater than zero")]
    InvalidDuration,

    #[msg("Math overflow")]
    MathOverflow,
}