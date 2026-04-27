"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { AUDD_MINT, AUDD_DECIMALS } from "@/lib/constants";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

export default function Navbar() {
  const { publicKey, connected } = useWallet();
  const { connection }           = useConnection();
  const [auddBal, setAuddBal]    = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) { setAuddBal(null); return; }
    const ata = getAssociatedTokenAddressSync(AUDD_MINT, publicKey);
    connection.getTokenAccountBalance(ata)
      .then(r => setAuddBal(Number(r.value.amount) / 10 ** AUDD_DECIMALS))
      .catch(() => setAuddBal(0));
  }, [publicKey, connection]);

  return (
    <nav className="w-full border-b border-gray-800 bg-gray-950 px-6 py-3
                    flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-white font-bold text-lg tracking-tight">
          Sol<span className="text-purple-400">AUDD</span>
        </Link>
        <div className="hidden sm:flex gap-4 text-sm text-gray-400">
          <Link href="/pay/new" className="hover:text-white transition">
            Payment
          </Link>
          <Link href="/stream" className="hover:text-white transition">
            Stream
          </Link>
          <Link href="/merchant" className="hover:text-white transition">
            Merchant
          </Link>
          <Link href="/treasury" className="hover:text-white transition">
            Treasury
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {connected && auddBal !== null && (
          <div className="hidden sm:flex items-center gap-1 px-3 py-1
                          bg-gray-800 rounded-lg text-sm">
            <span className="text-gray-400">AUDD</span>
            <span className="text-white font-medium">
              {auddBal.toLocaleString("en-AU", { maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
        <WalletMultiButton style={{ fontSize: "13px", padding: "8px 16px" }} />
      </div>
    </nav>
  );
}