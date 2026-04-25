"use client";

import { useCallback } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getProgram } from "@/lib/anchor";
import { AUDD_MINT, toAuddUnits } from "@/lib/constants";

export function useEscrow() {
  const wallet     = useAnchorWallet();
  const { connection } = useConnection();

  const createEscrow = useCallback(
    async (
      recipientAddress: string,
      auddAmount: number,
      releaseTimestamp: number
    ) => {
      if (!wallet) throw new Error("Wallet not connected");

      const program   = getProgram(wallet);
      const recipient = new PublicKey(recipientAddress);
      const mint      = AUDD_MINT;

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          wallet.publicKey.toBuffer(),
          recipient.toBuffer(),
        ],
        program.programId
      );

      const depositorAta = getAssociatedTokenAddressSync(
        mint, wallet.publicKey
      );
      const vaultAta = getAssociatedTokenAddressSync(
        mint, escrowPda, true
      );

      const amount      = new BN(toAuddUnits(auddAmount).toString());
      const releaseTime = new BN(releaseTimestamp);

      const tx = await program.methods
        .createEscrow(amount, releaseTime, recipient)
        .accounts({
          depositor:     wallet.publicKey,
          escrowAccount: escrowPda,
          mint,
          depositorAta,
          vaultAta,
          tokenProgram:            TOKEN_PROGRAM_ID,
          associatedTokenProgram:  ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram:           SystemProgram.programId,
        })
        .rpc();

      return { tx, escrowPda: escrowPda.toString() };
    },
    [wallet]
  );

  const releaseEscrow = useCallback(
    async (depositorAddress: string) => {
      if (!wallet) throw new Error("Wallet not connected");

      const program   = getProgram(wallet);
      const depositor = new PublicKey(depositorAddress);
      const mint      = AUDD_MINT;

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          depositor.toBuffer(),
          wallet.publicKey.toBuffer(),
        ],
        program.programId
      );

      const vaultAta = getAssociatedTokenAddressSync(
        mint, escrowPda, true
      );
      const recipientAta = getAssociatedTokenAddressSync(
        mint, wallet.publicKey
      );

      const tx = await program.methods
        .releaseEscrow()
        .accounts({
          recipient:     wallet.publicKey,
          escrowAccount: escrowPda,
          mint,
          vaultAta,
          recipientAta,
          tokenProgram:            TOKEN_PROGRAM_ID,
          associatedTokenProgram:  ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram:           SystemProgram.programId,
        })
        .rpc();

      return { tx };
    },
    [wallet]
  );

  const fetchEscrow = useCallback(
    async (depositorAddress: string, recipientAddress: string) => {
      if (!wallet) throw new Error("Wallet not connected");

      const program   = getProgram(wallet);
      const depositor = new PublicKey(depositorAddress);
      const recipient = new PublicKey(recipientAddress);

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          depositor.toBuffer(),
          recipient.toBuffer(),
        ],
        program.programId
      );

      const escrow = await program.account.escrowAccount.fetch(escrowPda);
      return escrow;
    },
    [wallet]
  );

  return { createEscrow, releaseEscrow, fetchEscrow };
}