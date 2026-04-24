import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 bg-gray-950 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">SolAUDD</h1>
        <p className="text-gray-400 text-lg">
          Australian Dollar stablecoin infrastructure on Solana
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        <Link href="/pay/new"
          className="p-6 rounded-xl bg-purple-900 hover:bg-purple-800 transition">
          <h2 className="font-semibold text-lg">Payment Link</h2>
          <p className="text-sm text-purple-300 mt-1">Create & share a payment link</p>
        </Link>

        <Link href="/merchant"
          className="p-6 rounded-xl bg-teal-900 hover:bg-teal-800 transition">
          <h2 className="font-semibold text-lg">Merchant Vault</h2>
          <p className="text-sm text-teal-300 mt-1">Accept AUDD payments</p>
        </Link>

        <Link href="/stream"
          className="p-6 rounded-xl bg-blue-900 hover:bg-blue-800 transition">
          <h2 className="font-semibold text-lg">Salary Stream</h2>
          <p className="text-sm text-blue-300 mt-1">Drip AUDD per second</p>
        </Link>

        <Link href="/treasury"
          className="p-6 rounded-xl bg-amber-900 hover:bg-amber-800 transition">
          <h2 className="font-semibold text-lg">Treasury</h2>
          <p className="text-sm text-amber-300 mt-1">Business AUDD management</p>
        </Link>
      </div>
    </main>
  );
}