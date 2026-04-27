"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useTreasury } from "@/hooks/useTreasury";
import { AUDD_DECIMALS } from "@/lib/constants";

export default function TreasuryPanel() {
  const { connected, publicKey } = useWallet();
  const { initTreasury, depositTreasury, executePayment, fetchTreasury } =
    useTreasury();

  const [treasury,   setTreasury]   = useState<any>(null);
  const [name,       setName]       = useState("");
  const [depositAmt, setDepositAmt] = useState("");
  const [payTo,      setPayTo]      = useState("");
  const [payAmt,     setPayAmt]     = useState("");
  const [memo,       setMemo]       = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [successTx,  setSuccessTx]  = useState("");
  const [tab,        setTab]        = useState<"overview"|"deposit"|"pay"|"setup">("overview");

  useEffect(() => {
    if (!publicKey) return;
    fetchTreasury()
      .then(setTreasury)
      .catch(() => setTreasury(null));
  }, [publicKey, fetchTreasury]);

  const refresh = async () => {
    try {
      const t = await fetchTreasury();
      setTreasury(t);
    } catch {}
  };

  const handleInit = async () => {
    setLoading(true); setError("");
    try {
      await initTreasury(name);
      await refresh();
      setTab("overview");
    } catch (e: any) {
      setError(e.message ?? "Failed");
    } finally { setLoading(false); }
  };

  const handleDeposit = async () => {
    setLoading(true); setError(""); setSuccessTx("");
    try {
      const { tx } = await depositTreasury(Number(depositAmt));
      setSuccessTx(tx);
      setDepositAmt("");
      await refresh();
    } catch (e: any) {
      setError(e.message ?? "Failed");
    } finally { setLoading(false); }
  };

  const handlePay = async () => {
    setLoading(true); setError(""); setSuccessTx("");
    try {
      const { tx } = await executePayment(payTo, Number(payAmt), memo || "Payment");
      setSuccessTx(tx);
      setPayTo(""); setPayAmt(""); setMemo("");
      await refresh();
    } catch (e: any) {
      setError(e.message ?? "Failed");
    } finally { setLoading(false); }
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <p className="text-gray-400">Connect wallet to manage treasury</p>
        <WalletMultiButton />
      </div>
    );
  }

  const totalIn  = treasury
    ? treasury.totalIn.toNumber() / 10 ** AUDD_DECIMALS
    : 0;
  const totalOut = treasury
    ? treasury.totalOut.toNumber() / 10 ** AUDD_DECIMALS
    : 0;
  const balance  = totalIn - totalOut;

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["overview", "deposit", "pay", "setup"].map(t => (
          <button
            key={t}
            onClick={() => { setTab(t as any); setError(""); setSuccessTx(""); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize
              ${tab === t
                ? "bg-amber-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"}`}>
            {t === "pay" ? "Pay" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Setup */}
      {tab === "setup" && (
        <div className="p-6 bg-gray-900 rounded-2xl flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white">
            {treasury ? "Treasury exists" : "Create Treasury"}
          </h2>
          {!treasury ? (
            <>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Company treasury name"
                maxLength={32}
                className="w-full p-3 bg-gray-800 text-white rounded-xl
                           border border-gray-700 focus:border-amber-500
                           focus:outline-none text-sm"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={handleInit}
                disabled={loading || !name.trim()}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500
                           disabled:bg-gray-700 disabled:text-gray-500
                           text-white font-semibold rounded-xl transition">
                {loading ? "Creating..." : "Create Treasury"}
              </button>
            </>
          ) : (
            <div className="p-4 bg-gray-800 rounded-xl">
              <p className="text-gray-400 text-sm">
                Treasury <span className="text-white font-medium">
                  {treasury.name}
                </span> already exists for this wallet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Overview */}
      {tab === "overview" && !treasury && (
        <div className="p-6 bg-gray-900 rounded-2xl text-center">
          <p className="text-gray-400 mb-4">No treasury found.</p>
          <button
            onClick={() => setTab("setup")}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500
                       text-white font-semibold rounded-xl transition">
            Create Treasury
          </button>
        </div>
      )}

      {tab === "overview" && treasury && (
        <div className="flex flex-col gap-4">
          <div className="p-6 bg-gray-900 rounded-2xl">
            <h2 className="text-xl font-bold text-white mb-4">
              {treasury.name}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500">Balance</p>
                <p className="text-xl font-bold text-amber-400">
                  {balance.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">AUDD</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500">Total In</p>
                <p className="text-xl font-bold text-green-400">
                  {totalIn.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">AUDD</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500">Total Out</p>
                <p className="text-xl font-bold text-red-400">
                  {totalOut.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">AUDD</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-900 rounded-2xl">
            <p className="text-xs text-gray-500 mb-1">Authority</p>
            <p className="text-sm font-mono text-gray-300 break-all">
              {publicKey?.toString()}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTab("deposit")}
              className="flex-1 py-3 bg-green-700 hover:bg-green-600
                         text-white font-semibold rounded-xl transition text-sm">
              Deposit AUDD
            </button>
            <button
              onClick={() => setTab("pay")}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-500
                         text-white font-semibold rounded-xl transition text-sm">
              Pay Someone
            </button>
          </div>
        </div>
      )}

      {/* Deposit */}
      {tab === "deposit" && (
        <div className="p-6 bg-gray-900 rounded-2xl flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white">Deposit AUDD</h2>
          <input
            type="number"
            value={depositAmt}
            onChange={e => setDepositAmt(e.target.value)}
            placeholder="Amount to deposit"
            className="w-full p-3 bg-gray-800 text-white rounded-xl
                       border border-gray-700 focus:border-amber-500
                       focus:outline-none text-sm"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {successTx && (
            <p
              className="text-green-400 text-xs cursor-pointer hover:underline"
              onClick={() => window.open(
                `https://explorer.solana.com/tx/${successTx}?cluster=devnet`,
                "_blank"
              )}>
              Deposited — view on Explorer
            </p>
          )}
          <button
            onClick={handleDeposit}
            disabled={loading || !depositAmt}
            className="w-full py-3 bg-green-700 hover:bg-green-600
                       disabled:bg-gray-700 disabled:text-gray-500
                       text-white font-semibold rounded-xl transition">
            {loading ? "Depositing..." : "Deposit"}
          </button>
        </div>
      )}

      {/* Pay */}
      {tab === "pay" && (
        <div className="p-6 bg-gray-900 rounded-2xl flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white">Execute Payment</h2>
          <input
            type="text"
            value={payTo}
            onChange={e => setPayTo(e.target.value)}
            placeholder="Recipient wallet address"
            className="w-full p-3 bg-gray-800 text-white rounded-xl
                       border border-gray-700 focus:border-amber-500
                       focus:outline-none text-sm"
          />
          <input
            type="number"
            value={payAmt}
            onChange={e => setPayAmt(e.target.value)}
            placeholder="Amount (AUDD)"
            className="w-full p-3 bg-gray-800 text-white rounded-xl
                       border border-gray-700 focus:border-amber-500
                       focus:outline-none text-sm"
          />
          <input
            type="text"
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="Memo (e.g. April salary)"
            maxLength={64}
            className="w-full p-3 bg-gray-800 text-white rounded-xl
                       border border-gray-700 focus:border-amber-500
                       focus:outline-none text-sm"
          />

          {/* Treasury balance reminder */}
          {treasury && (
            <div className="p-3 bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-500">
                Available: <span className="text-amber-400 font-medium">
                  {balance.toFixed(2)} AUDD
                </span>
              </p>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {successTx && (
            <p
              className="text-green-400 text-xs cursor-pointer hover:underline"
              onClick={() => window.open(
                `https://explorer.solana.com/tx/${successTx}?cluster=devnet`,
                "_blank"
              )}>
              Payment sent — view on Explorer
            </p>
          )}
          <button
            onClick={handlePay}
            disabled={loading || !payTo || !payAmt}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500
                       disabled:bg-gray-700 disabled:text-gray-500
                       text-white font-semibold rounded-xl transition">
            {loading ? "Sending..." : "Send Payment"}
          </button>
        </div>
      )}
    </div>
  );
}