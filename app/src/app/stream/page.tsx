"use client";

import { useState } from "react";
import StreamCreator from "@/components/stream/StreamCreator";
import StreamMonitor from "@/components/stream/StreamMonitor";
import Link from "next/link";

export default function StreamPage() {
  const [tab,    setTab]    = useState<"create" | "monitor">("create");
  const [sender, setSender] = useState("");

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="text-gray-500 hover:text-white text-sm mb-6 block">
          {"←"} Back
        </Link>

        <h1 className="text-3xl font-bold mb-2">Salary Stream</h1>
        <p className="text-gray-400 mb-6">
          Stream AUDD per second — real-time salary on Solana.
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("create")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition
              ${tab === "create"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"}`}>
            Create Stream
          </button>
          <button
            onClick={() => setTab("monitor")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition
              ${tab === "monitor"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"}`}>
            Monitor Stream
          </button>
        </div>

        {tab === "create" && <StreamCreator />}

        {tab === "monitor" && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Sender wallet address
              </label>
              <input
                type="text"
                value={sender}
                onChange={e => setSender(e.target.value)}
                placeholder="Paste sender address..."
                className="w-full p-3 bg-gray-800 text-white rounded-xl
                           border border-gray-700 focus:border-blue-500
                           focus:outline-none text-sm"
              />
            </div>
            {sender && <StreamMonitor senderAddress={sender} />}
          </div>
        )}
      </div>
    </main>
  );
}