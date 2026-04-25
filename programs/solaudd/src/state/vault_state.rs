use anchor_lang::prelude::*;

#[account]
pub struct VaultAccount {
    pub merchant:      Pubkey,  // 32
    pub mint:          Pubkey,  // 32
    pub merchant_id:   String,  // 4 + 32
    pub total_received: u64,    // 8
    pub bump:          u8,      // 1
}

impl VaultAccount {
    pub const LEN: usize = 8 + 32 + 32 + (4 + 32) + 8 + 1;
}