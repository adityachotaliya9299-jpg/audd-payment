use anchor_lang::prelude::*;

#[account]
pub struct TreasuryAccount {
    pub authority: Pubkey,  // 32
    pub mint:      Pubkey,  // 32
    pub name:      String,  // 4 + 32
    pub total_in:  u64,     // 8
    pub total_out: u64,     // 8
    pub bump:      u8,      // 1
}

impl TreasuryAccount {
    pub const LEN: usize = 8 + 32 + 32 + (4 + 32) + 8 + 8 + 1;
}