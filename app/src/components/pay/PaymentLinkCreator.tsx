"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEscrow } from "@/hooks/useEscrow";
import { QRCodeSVG as QRCode } from "qrcode.react";

export default function PaymentLinkCreator() {
  const { connected, publicKey } = useWallet();
  const { createEscrow }         = useEscrow();

  const [recipient,    setRecipient]    = useState("");
  const [amount,       setAmount]       = useState("");
  const [days,         setDays]         = useState("7");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [result,       setResult]       = useState<{
    tx: string;
    escrowPda: string;
    payLink: string;
  } | null>(null);

  const handleCreate = async () => {
    if (!connected) return;
    setError("");
    setLoading(true);

    try {
      const releaseTimestamp =
        Math.floor(Date.now() / 1000) + Number(days) * 86400;

      const { tx, escrowPda } = await createEscrow(
        recipient,
        Number(amount),
        releaseTimestamp
      );

      const payLink = `${window.location.origin}/pay/${escrowPda}`;

      setResult({ tx, escrowPda, payLink });
    } catch (e: any) {
      setError(e.message ?? "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <p className="text-gray-400">Connect your wallet to create a payment</p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-gray-900 rounded-2xl">
      <h2 className="text-xl font-bold text-white mb-6">
        Create AUDD Payment
      </h2>

      {!result ? (
        <div className="flex flex-col gap-4">
          {/* Recipient */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Recipient wallet address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              placeholder="Solana address..."
              className="w-full p-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Amount (AUDD)
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="100"
              min="1"
              className="w-full p-3 bg-gray-800 text-white rounded-xl
                         border border-gray-700 focus:border-purple-500
                         focus:outline-none text-sm"
            />
          </div>

          {/* Release days */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Release after (days)
            </label>
            <select
              value={days}
              onChange={e => setDays(e.target.value)}
              className="w-full p-3 bg-gray-800 text-white rounded-xl
                         border border-gray-700 focus:border-purple-500
                         focus:outline-none text-sm">
              <option value="0">Immediately</option>
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
          </div>

          {/* From */}
          <div className="p-3 bg-gray-800 rounded-xl">
            <p className="text-xs text-gray-500">From</p>
            <p className="text-sm text-gray-300 font-mono truncate">
              {publicKey?.toString()}
            </p>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 p-3 rounded-xl">
              {error}
            </p>
          )}

          <button
            onClick={handleCreate}
            disabled={loading || !recipient || !amount}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500
                       disabled:bg-gray-700 disabled:text-gray-500
                       text-white font-semibold rounded-xl transition">
            {loading ? "Creating escrow..." : "Lock AUDD & Create Link"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Success */}
          <div className="p-4 bg-green-900/30 border border-green-700
                          rounded-xl text-center">
            <p className="text-green-400 font-semibold text-lg">
              ✅ Payment Created!
            </p>
            <p className="text-gray-400 text-sm mt-1">
              AUDD locked on-chain
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center p-4 bg-white rounded-xl">
            <QRCode value={result.payLink} size={200} />
          </div>

          {/* Pay link */}
          <div className="p-3 bg-gray-800 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Payment link</p>
            <p className="text-sm text-purple-400 break-all">
              {result.payLink}
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(result.payLink)}
              className="mt-2 text-xs text-gray-400 hover:text-white transition">
              Copy link
            </button>
          </div>

          {/* TX */}
          <div className="p-3 bg-gray-800 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Transaction</p>

                <a
                href={`https://explorer.solana.com/tx/${result.tx}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-400 hover:underline break-all">
                View on Explorer ↗
                </a>
          </div>

          <button
            onClick={() => setResult(null)}
            className="w-full py-2 border border-gray-700 text-gray-400
                       hover:text-white rounded-xl transition text-sm">
            Create another
          </button>
        </div>
      )}
    </div>
  );
}