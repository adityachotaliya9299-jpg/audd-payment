"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useStream } from "@/hooks/useStream";
import { AUDD_DECIMALS } from "@/lib/constants";

interface Props {
  senderAddress: string;
}

export default function StreamMonitor({ senderAddress }: Props) {
  const { publicKey }  = useWallet();
  const { fetchStream, withdrawStream } = useStream();

  const [stream,    setStream]    = useState<any>(null);
  const [elapsed,   setElapsed]   = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [withdrawTx, setWithdrawTx] = useState("");

  // Fetch stream data
  useEffect(() => {
    if (!publicKey || !senderAddress) return;

    fetchStream(senderAddress, publicKey.toString())
      .then(setStream)
      .catch(() => setError("Stream not found"));
  }, [publicKey, senderAddress, fetchStream]);

  // Real-time elapsed ticker
  useEffect(() => {
    if (!stream) return;
    const interval = setInterval(() => {
      const now  = Math.floor(Date.now() / 1000);
      const secs = Math.min(now - stream.startTime.toNumber(),
                            stream.endTime.toNumber() - stream.startTime.toNumber());
      setElapsed(Math.max(0, secs));
    }, 1000);
    return () => clearInterval(interval);
  }, [stream]);

  const earned    = stream
    ? (stream.amountPerSec.toNumber() * elapsed) / 10 ** AUDD_DECIMALS
    : 0;
  const withdrawn = stream
    ? stream.withdrawn.toNumber() / 10 ** AUDD_DECIMALS
    : 0;
  const claimable = Math.max(0, earned - withdrawn);

  const totalDuration = stream
    ? stream.endTime.toNumber() - stream.startTime.toNumber()
    : 1;
  const progress = Math.min(100, (elapsed / totalDuration) * 100);

  const handleWithdraw = async () => {
    setLoading(true);
    setError("");
    try {
      const { tx } = await withdrawStream(senderAddress);
      setWithdrawTx(tx);
      // Refresh
      const updated = await fetchStream(
        senderAddress, publicKey!.toString()
      );
      setStream(updated);
    } catch (e: any) {
      setError(e.message ?? "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  if (error) return (
    <p className="text-red-400 text-sm p-4">{error}</p>
  );

  if (!stream) return (
    <p className="text-gray-400 text-sm p-4">Loading stream...</p>
  );

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-gray-900 rounded-2xl">
      <h2 className="text-xl font-bold text-white mb-6">
        Live Stream
      </h2>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Stream progress</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-gray-800 rounded-xl">
          <p className="text-xs text-gray-500">Earned</p>
          <p className="text-lg font-bold text-white">
            {earned.toFixed(4)}
          </p>
          <p className="text-xs text-gray-500">AUDD</p>
        </div>
        <div className="p-3 bg-gray-800 rounded-xl">
          <p className="text-xs text-gray-500">Claimable</p>
          <p className="text-lg font-bold text-blue-400">
            {claimable.toFixed(4)}
          </p>
          <p className="text-xs text-gray-500">AUDD</p>
        </div>
        <div className="p-3 bg-gray-800 rounded-xl">
          <p className="text-xs text-gray-500">Withdrawn</p>
          <p className="text-lg font-bold text-green-400">
            {withdrawn.toFixed(4)}
          </p>
          <p className="text-xs text-gray-500">AUDD</p>
        </div>
        <div className="p-3 bg-gray-800 rounded-xl">
          <p className="text-xs text-gray-500">Rate</p>
          <p className="text-lg font-bold text-white">
            {(stream.amountPerSec.toNumber() / 10 ** AUDD_DECIMALS).toFixed(6)}
          </p>
          <p className="text-xs text-gray-500">AUDD/sec</p>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-3">{error}</p>
      )}

      {withdrawTx && (
        <div className="p-3 bg-gray-800 rounded-xl mb-3">
          <p className="text-xs text-gray-500 mb-1">Last withdrawal</p>
          
            href={`https://explorer.solana.com/tx/${withdrawTx}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-400 hover:underline break-all">
            View on Explorer &nearr;
          </a>
        </div>
      )}

      <button
        onClick={handleWithdraw}
        disabled={loading || claimable <= 0 || stream.isCancelled}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500
                   disabled:bg-gray-700 disabled:text-gray-500
                   text-white font-semibold rounded-xl transition">
        {loading
          ? "Withdrawing..."
          : claimable > 0
            ? `Withdraw ${claimable.toFixed(4)} AUDD`
            : "Nothing to withdraw yet"}
      </button>

      {stream.isCancelled && (
        <p className="text-center text-gray-500 text-sm mt-3">
          Stream cancelled
        </p>
      )}
    </div>
  );
}