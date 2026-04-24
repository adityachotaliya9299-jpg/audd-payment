use anchor_lang::prelude::*;

#[error_code]
pub enum SolAuddError {
    #[msg("Release time has not passed yet")]
    TooEarly,

    #[msg("Only the depositor can refund")]
    Unauthorized,

    #[msg("Only the recipient can release funds")]
    WrongRecipient,

    #[msg("Stream has ended")]
    StreamEnded,

    #[msg("Stream has been cancelled")]
    StreamCancelled,

    #[msg("Nothing to withdraw yet")]
    NothingToWithdraw,

    #[msg("Treasury name too long (max 32 chars)")]
    NameTooLong,

    #[msg("Insufficient treasury balance")]
    InsufficientFunds,

    #[msg("Memo too long (max 64 chars)")]
    MemoTooLong,

    #[msg("Invalid merchant ID")]
    InvalidMerchantId,
}