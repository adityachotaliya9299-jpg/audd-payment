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

export function useTreasury() {
  const wallet = useAnchorWallet();

  const initTreasury = useCallback(async (name: string) => {
    if (!wallet) throw new Error("Wallet not connected");
    const program = getProgram(wallet);
    const mint = AUDD_MINT;
    const [treasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), wallet.publicKey.toBuffer()],
      program.programId
    );
    const treasuryAta = getAssociatedTokenAddressSync(mint, treasuryPda, true);
    const tx = await program.methods.initTreasury(name)
      .accounts({
        authority: wallet.publicKey,
        treasuryAccount: treasuryPda,
        mint,
        treasuryAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }).rpc();
    return { tx, treasuryPda: treasuryPda.toString() };
  }, [wallet]);

  const depositTreasury = useCallback(async (auddAmount: number) => {
    if (!wallet) throw new Error("Wallet not connected");
    const program = getProgram(wallet);
    const mint = AUDD_MINT;
    const [treasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), wallet.publicKey.toBuffer()],
      program.programId
    );
    const authorityAta = getAssociatedTokenAddressSync(mint, wallet.publicKey);
    const treasuryAta = getAssociatedTokenAddressSync(mint, treasuryPda, true);
    const tx = await program.methods.depositTreasury(
      new BN(toAuddUnits(auddAmount).toString())
    ).accounts({
      authority: wallet.publicKey,
      treasuryAccount: treasuryPda,
      mint,
      authorityAta,
      treasuryAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    }).rpc();
    return { tx };
  }, [wallet]);

  const executePayment = useCallback(async (
    recipientAddress: string,
    auddAmount: number,
    memo: string
  ) => {
    if (!wallet) throw new Error("Wallet not connected");
    const program = getProgram(wallet);
    const mint = AUDD_MINT;
    const recipient = new PublicKey(recipientAddress);
    const [treasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), wallet.publicKey.toBuffer()],
      program.programId
    );
    const treasuryAta = getAssociatedTokenAddressSync(mint, treasuryPda, true);
    const recipientAta = getAssociatedTokenAddressSync(mint, recipient);
    const tx = await program.methods.executePaymentTreasury(
      new BN(toAuddUnits(auddAmount).toString()),
      memo
    ).accounts({
      authority: wallet.publicKey,
      treasuryAccount: treasuryPda,
      mint,
      treasuryAta,
      recipientAta,
      recipient,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    }).rpc();
    return { tx };
  }, [wallet]);

  const fetchTreasury = useCallback(async () => {
    if (!wallet) throw new Error("Wallet not connected");
    const program = getProgram(wallet);
    const [treasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), wallet.publicKey.toBuffer()],
      program.programId
    );
    return await (program.account as any).treasuryAccount.fetch(treasuryPda);
  }, [wallet]);

  return { initTreasury, depositTreasury, executePayment, fetchTreasury };
}
