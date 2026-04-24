import { PublicKey } from "@solana/web3.js";

export const NETWORK = (process.env.NEXT_PUBLIC_NETWORK ?? "devnet") as "devnet" | "mainnet-beta";
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
export const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID ?? "HHawtfSVhJ1hzRLewqquN6wUFTqhdfcZV2q35fqHermq");
export const AUDD_MINT = new PublicKey(process.env.NEXT_PUBLIC_AUDD_MINT ?? "6n15Hkj7WDftaWfKg7Js869JrufdeoTC2WE12NkdZzPT");
export const AUDD_DECIMALS = Number(process.env.NEXT_PUBLIC_AUDD_DECIMALS ?? 6);
export const toAuddUnits = (amount: number): bigint => BigInt(Math.round(amount * 10 ** AUDD_DECIMALS));
export const fromAuddUnits = (units: bigint): number => Number(units) / 10 ** AUDD_DECIMALS;