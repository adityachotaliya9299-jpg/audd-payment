use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct EscrowAccount {
    pub depositor:    Pubkey,   // 32
    pub recipient:    Pubkey,   // 32
    pub mint:         Pubkey,   // 32 
    pub amount:       u64,      // 8
    pub release_time: i64,      // 8
    pub is_released:  bool,     // 1
    pub is_refunded:  bool,     // 1
    pub bump:         u8,       // 1
}

impl EscrowAccount {
    // 8 discriminator + fields above
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 1 + 1 + 1;
}