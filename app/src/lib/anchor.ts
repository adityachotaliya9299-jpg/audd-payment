import { Connection } from "@solana/web3.js";
import { AnchorProvider, Program, setProvider, Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { RPC_URL, PROGRAM_ID } from "./constants";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const idl = require("../../idl/solaudd.json") as Idl;

export function getProvider(wallet: AnchorWallet): AnchorProvider {
  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  setProvider(provider);
  return provider;
}

export function getProgram(wallet: AnchorWallet): Program {
  const provider = getProvider(wallet);
  return new Program(idl, provider);
}