"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useMerchant } from "@/hooks/useMerchant";
import { AUDD_DECIMALS } from "@/lib/constants";
import { QRCodeSVG as QRCode } from "qrcode.react";

export default function VaultDashboard() {
  const { connected, publicKey } = useWallet();
  const { initVault, withdrawVault, fetchVault } = useMerchant();

  const [vault,       setVault]       = useState<any>(null);
  const [merchantId,  setMerchantId]  = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [successTx,   setSuccessTx]   = useState("");
  const [tab,         setTab]         = useState<"dashboard" | "setup">("dashboard");

  const payLink = publicKey
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/pay/merchant/${publicKey.toString()}`
    : "";

  useEffect(() => {
    if (!publicKey) return;
    fetchVault()
      .then(setVault)
      .catch(() => setVault(null));
  }, [publicKey, fetchVault]);

  const handleInitVault = async () => {
    if (!merchantId.trim()) return;
    setLoading(true);
    setError("");
    try {
      await initVault(merchantId);
      const v = await fetchVault();
      setVault(v);
      setTab("dashboard");
    } catch (e: any) {
      setError(e.message ?? "Failed to create vault");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmt) return;
    setLoading(true);
    setError("");
    try {
      const { tx } = await withdrawVault(Number(withdrawAmt));
      setSuccessTx(tx);
      const v = await fetchVault();
      setVault(v);
      setWithdrawAmt("");
    } catch (e: any) {
      setError(e.message ?? "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <p className="text-gray-400">Connect wallet to access merchant vault</p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("dashboard")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition
            ${tab === "dashboard"
              ? "bg-teal-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"}`}>
          Dashboard
        </button>
        <button
          onClick={() => setTab("setup")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition
            ${tab === "setup"
              ? "bg-teal-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"}`}>
          {vault ? "Settings" : "Setup Vault"}
        </button>
      </div>

      {tab === "setup" && (
        <div className="p-6 bg-gray-900 rounded-2xl flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white">
            {vault ? "Vault Settings" : "Create Merchant Vault"}
          </h2>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Business / Merchant name
            </label>
            <input
              type="text"
              value={merchantId}
              onChange={e => setMerchantId(e.target.value)}
              placeholder="e.g. my-coffee-shop"
              maxLength={32}
              className="w-full p-3 bg-gray-800 text-white rounded-xl
                         border border-gray-700 focus:border-teal-500
                         focus:outline-none text-sm"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <button
            onClick={handleInitVault}
            disabled={loading || !merchantId.trim()}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500
                       disabled:bg-gray-700 disabled:text-gray-500
                       text-white font-semibold rounded-xl transition">
            {loading ? "Creating..." : vault ? "Update" : "Create Vault"}
          </button>
        </div>
      )}

      {tab === "dashboard" && !vault && (
        <div className="p-6 bg-gray-900 rounded-2xl text-center">
          <p className="text-gray-400 mb-4">No vault found for this wallet.</p>
          <button
            onClick={() => setTab("setup")}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-500
                       text-white font-semibold rounded-xl transition">
            Create Vault
          </button>
        </div>
      )}

      {tab === "dashboard" && vault && (
        <div className="flex flex-col gap-4">
          {/* Stats */}
          <div className="p-6 bg-gray-900 rounded-2xl">
            <h2 className="text-xl font-bold text-white mb-4">
              {vault.merchantId}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500">Total received</p>
                <p className="text-2xl font-bold text-teal-400">
                  {(vault.totalReceived.toNumber() / 10 ** AUDD_DECIMALS).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">AUDD</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500">Wallet</p>
                <p className="text-xs text-gray-300 font-mono mt-1 break-all">
                  {publicKey?.toString().slice(0, 16)}...
                </p>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="p-6 bg-gray-900 rounded-2xl">
            <p className="text-sm font-medium text-white mb-3">
              Payment QR Code
            </p>
            <div className="flex justify-center p-4 bg-white rounded-xl mb-3">
              <QRCode value={payLink} size={180} />
            </div>
            <p className="text-xs text-gray-500 break-all text-center">
              {payLink}
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(payLink)}
              className="w-full mt-3 py-2 border border-gray-700
                         text-gray-400 hover:text-white rounded-xl
                         transition text-sm">
              Copy payment link
            </button>
          </div>

          {/* Withdraw */}
          <div className="p-6 bg-gray-900 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              Withdraw AUDD
            </h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={withdrawAmt}
                onChange={e => setWithdrawAmt(e.target.value)}
                placeholder="Amount"
                className="flex-1 p-3 bg-gray-800 text-white rounded-xl
                           border border-gray-700 focus:border-teal-500
                           focus:outline-none text-sm"
              />
              <button
                onClick={handleWithdraw}
                disabled={loading || !withdrawAmt}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-500
                           disabled:bg-gray-700 disabled:text-gray-500
                           text-white font-semibold rounded-xl transition">
                {loading ? "..." : "Withdraw"}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}

            {successTx && (
              <p
                className="text-teal-400 text-xs mt-2 cursor-pointer hover:underline"
                onClick={() => window.open(
                  `https://explorer.solana.com/tx/${successTx}?cluster=devnet`,
                  "_blank"
                )}>
                Withdrawal successful — view on Explorer
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}