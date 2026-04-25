"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useStream } from "@/hooks/useStream";

export default function StreamCreator() {
  const { connected, publicKey } = useWallet();
  const { createStream }         = useStream();

  const [recipient,   setRecipient]   = useState("");
  const [rateAudd,    setRateAudd]    = useState("");
  const [hours,       setHours]       = useState("1");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [result,      setResult]      = useState<{
    tx: string;
    streamPda: string;
    totalAudd: number;
  } | null>(null);

  const ratePerSec   = Number(rateAudd) / 3600;
  const durationSecs = Number(hours) * 3600;
  const totalAudd    = ratePerSec * durationSecs;

  const handleCreate = async () => {
    if (!connected) return;
    setError("");
    setLoading(true);

    try {
      const { tx, streamPda } = await createStream(
        recipient,
        ratePerSec,
        durationSecs
      );
      setResult({ tx, streamPda, totalAudd });
    } catch (e: any) {
      setError(e.message ?? "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <p className="text-gray-400">Connect wallet to create a stream</p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-gray-900 rounded-2xl">
      <h2 className="text-xl font-bold text-white mb-6">
        Create AUDD Stream
      </h2>

      {!result ? (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Recipient wallet
            </label>
            <input
              type="text"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              placeholder="Solana address..."
              className="w-full p-3 bg-gray-800 text-white rounded-xl
                         border border-gray-700 focus:border-blue-500
                         focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Rate (AUDD per hour)
            </label>
            <input
              type="number"
              value={rateAudd}
              onChange={e => setRateAudd(e.target.value)}
              placeholder="e.g. 50"
              min="0.000001"
              step="0.01"
              className="w-full p-3 bg-gray-800 text-white rounded-xl
                         border border-gray-700 focus:border-blue-500
                         focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Duration
            </label>
            <select
              value={hours}
              onChange={e => setHours(e.target.value)}
              className="w-full p-3 bg-gray-800 text-white rounded-xl
                         border border-gray-700 focus:border-blue-500
                         focus:outline-none text-sm">
              <option value="1">1 hour</option>
              <option value="8">8 hours</option>
              <option value="24">1 day</option>
              <option value="168">1 week</option>
              <option value="720">1 month</option>
            </select>
          </div>

          {/* Summary */}
          {rateAudd && (
            <div className="p-4 bg-blue-900/20 border border-blue-800
                            rounded-xl">
              <p className="text-blue-300 text-sm font-medium">
                Stream summary
              </p>
              <div className="mt-2 space-y-1 text-sm text-gray-300">
                <p>Rate: <span className="text-white font-mono">
                  {ratePerSec.toFixed(6)} AUDD/sec
                </span></p>
                <p>Total: <span className="text-white font-mono">
                  {totalAudd.toFixed(2)} AUDD
                </span></p>
                <p>Duration: <span className="text-white">
                  {hours} hour{Number(hours) > 1 ? "s" : ""}
                </span></p>
              </div>
            </div>
          )}

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
            disabled={loading || !recipient || !rateAudd}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500
                       disabled:bg-gray-700 disabled:text-gray-500
                       text-white font-semibold rounded-xl transition">
            {loading ? "Creating stream..." : "Start AUDD Stream"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-green-900/30 border border-green-700
                          rounded-xl text-center">
            <p className="text-green-400 font-semibold text-lg">
              Stream Started!
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {result.totalAudd.toFixed(2)} AUDD streaming now
            </p>
          </div>

          <div className="p-3 bg-gray-800 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Stream ID</p>
            <p className="text-sm text-blue-400 break-all font-mono">
              {result.streamPda}
            </p>
          </div>

          <div className="p-3 bg-gray-800 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Transaction</p>

            <a
                href={`https://explorer.solana.com/tx/${result.tx}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-400 hover:underline break-all"
            >
                View on Explorer →
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