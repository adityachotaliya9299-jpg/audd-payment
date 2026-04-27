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

export function useStream() {
  const wallet = useAnchorWallet();

  const createStream = useCallback(
    async (
      recipientAddress: string,
      auddPerSecond: number,
      durationSeconds: number
    ) => {
      if (!wallet) throw new Error("Wallet not connected");

      const program   = getProgram(wallet);
      const recipient = new PublicKey(recipientAddress);
      const mint      = AUDD_MINT;

      const [streamPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("stream"),
          wallet.publicKey.toBuffer(),
          recipient.toBuffer(),
        ],
        program.programId
      );

      const senderAta = getAssociatedTokenAddressSync(mint, wallet.publicKey);
      const vaultAta  = getAssociatedTokenAddressSync(mint, streamPda, true);

      const tx = await program.methods
        .createStream(
          new BN(toAuddUnits(auddPerSecond).toString()),
          new BN(durationSeconds)
        )
        .accounts({
          sender:        wallet.publicKey,
          recipient,
          streamAccount: streamPda,
          mint,
          senderAta,
          vaultAta,
          tokenProgram:           TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram:          SystemProgram.programId,
        })
        .rpc();

      return { tx, streamPda: streamPda.toString() };
    },
    [wallet]
  );

  const withdrawStream = useCallback(
    async (senderAddress: string) => {
      if (!wallet) throw new Error("Wallet not connected");

      const program = getProgram(wallet);
      const sender  = new PublicKey(senderAddress);
      const mint    = AUDD_MINT;

      const [streamPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("stream"),
          sender.toBuffer(),
          wallet.publicKey.toBuffer(),
        ],
        program.programId
      );

      const vaultAta     = getAssociatedTokenAddressSync(mint, streamPda, true);
      const recipientAta = getAssociatedTokenAddressSync(mint, wallet.publicKey);

      const tx = await program.methods
        .withdrawStream()
        .accounts({
          recipient:     wallet.publicKey,
          streamAccount: streamPda,
          mint,
          vaultAta,
          recipientAta,
          tokenProgram:           TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram:          SystemProgram.programId,
        })
        .rpc();

      return { tx };
    },
    [wallet]
  );

  const fetchStream = useCallback(
    async (senderAddress: string, recipientAddress: string) => {
      if (!wallet) throw new Error("Wallet not connected");

      const program   = getProgram(wallet);
      const sender    = new PublicKey(senderAddress);
      const recipient = new PublicKey(recipientAddress);

      const [streamPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("stream"),
          sender.toBuffer(),
          recipient.toBuffer(),
        ],
        program.programId
      );

      return await (program.account as any).streamAccount.fetch(streamPda);
    },
    [wallet]
  );

  return { createStream, withdrawStream, fetchStream };
}