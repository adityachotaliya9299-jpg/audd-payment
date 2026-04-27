import TreasuryPanel from "@/components/treasury/TreasuryPanel";
import Link from "next/link";

export default function TreasuryPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-lg mx-auto">
        <Link
          href="/"
          className="text-gray-500 hover:text-white text-sm mb-6 block">
          {"<-"} Back
        </Link>
        <h1 className="text-3xl font-bold mb-2">Treasury</h1>
        <p className="text-gray-400 mb-8">
          Business AUDD treasury. Deposit funds. Pay employees on-chain.
        </p>
        <TreasuryPanel />
      </div>
    </main>
  );
}