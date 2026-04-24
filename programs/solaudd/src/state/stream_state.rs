use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct StreamAccount {
    pub sender:         Pubkey,  // 32
    pub recipient:      Pubkey,  // 32
    pub mint:           Pubkey,  // 32
    pub amount_per_sec: u64,     // 8
    pub start_time:     i64,     // 8
    pub end_time:       i64,     // 8
    pub withdrawn:      u64,     // 8
    pub is_cancelled:   bool,    // 1
    pub bump:           u8,      // 1
}

impl StreamAccount {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 1;
}