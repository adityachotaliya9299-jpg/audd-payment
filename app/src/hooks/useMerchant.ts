"use client";

import { useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getProgram } from "@/lib/anchor";
import { AUDD_MINT, toAuddUnits } from "@/lib/constants";

export function useMerchant() {
  const wallet = useAnchorWallet();

  const initVault = useCallback(
    async (merchantId: string) => {
      if (!wallet) throw new Error("Wallet not connected");

      const program = getProgram(wallet);
      const mint    = AUDD_MINT;

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), wallet.publicKey.toBuffer()],
        program.programId
      );

      const vaultAta = getAssociatedTokenAddressSync(mint, vaultPda, true);

      const tx = await program.methods
        .initVault(merchantId)
        .accounts({
          merchant:     wallet.publicKey,
          vaultAccount: vaultPda,
          mint,
          vaultAta,
          tokenProgram:           TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram:          SystemProgram.programId,
        })
        .rpc();

      return { tx, vaultPda: vaultPda.toString() };
    },
    [wallet]
  );

  const receivePayment = useCallback(
    async (merchantAddress: string, auddAmount: number) => {
      if (!wallet) throw new Error("Wallet not connected");

      const program  = getProgram(wallet);
      const merchant = new PublicKey(merchantAddress);
      const mint     = AUDD_MINT;

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), merchant.toBuffer()],
        program.programId
      );

      const payerAta = getAssociatedTokenAddressSync(mint, wallet.publicKey);
      const vaultAta = getAssociatedTokenAddressSync(mint, vaultPda, true);

      const tx = await program.methods
        .receivePayment(new BN(toAuddUnits(auddAmount).toString()))
        .accounts({
          payer:        wallet.publicKey,
          vaultAccount: vaultPda,
          mint,
          payerAta,
          vaultAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { tx };
    },
    [wallet]
  );

  const withdrawVault = useCallback(
    async (auddAmount: number) => {
      if (!wallet) throw new Error("Wallet not connected");

      const program = getProgram(wallet);
      const mint    = AUDD_MINT;

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), wallet.publicKey.toBuffer()],
        program.programId
      );

      const vaultAta   = getAssociatedTokenAddressSync(mint, vaultPda, true);
      const merchantAta = getAssociatedTokenAddressSync(mint, wallet.publicKey);

      const tx = await program.methods
        .withdrawVault(new BN(toAuddUnits(auddAmount).toString()))
        .accounts({
          merchant:     wallet.publicKey,
          vaultAccount: vaultPda,
          mint,
          vaultAta,
          merchantAta,
          tokenProgram:           TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram:          SystemProgram.programId,
        })
        .rpc();

      return { tx };
    },
    [wallet]
  );

  const fetchVault = useCallback(
    async (merchantAddress?: string) => {
      if (!wallet) throw new Error("Wallet not connected");

      const program  = getProgram(wallet);
      const merchant = merchantAddress
        ? new PublicKey(merchantAddress)
        : wallet.publicKey;

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), merchant.toBuffer()],
        program.programId
      );

      return await program.account.vaultAccount.fetch(vaultPda);
    },
    [wallet]
  );

  return { initVault, receivePayment, withdrawVault, fetchVault };
}