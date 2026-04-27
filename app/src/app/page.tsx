import Link from "next/link";

const features = [
  {
    href:        "/pay/new",
    title:       "Payment Link",
    description: "Lock AUDD in escrow. Share a link. Recipient claims when ready.",
    icon:        "💸",
    color:       "purple",
    tag:         "Escrow",
  },
  {
    href:        "/merchant",
    title:       "Merchant Vault",
    description: "Accept AUDD payments via QR code. Withdraw anytime.",
    icon:        "🏪",
    color:       "teal",
    tag:         "Payments",
  },
  {
    href:        "/stream",
    title:       "Salary Stream",
    description: "Stream AUDD per second. Real-time payroll on Solana.",
    icon:        "🌊",
    color:       "blue",
    tag:         "Streaming",
  },
  {
    href:        "/treasury",
    title:       "Treasury",
    description: "Business AUDD treasury. Deposit funds, pay employees on-chain.",
    icon:        "🏦",
    color:       "amber",
    tag:         "Treasury",
  },
];

const colorMap: Record<string, string> = {
  purple: "bg-purple-900/40 hover:bg-purple-900/60 border-purple-800/50",
  teal:   "bg-teal-900/40 hover:bg-teal-900/60 border-teal-800/50",
  blue:   "bg-blue-900/40 hover:bg-blue-900/60 border-blue-800/50",
  amber:  "bg-amber-900/40 hover:bg-amber-900/60 border-amber-800/50",
};

const tagColor: Record<string, string> = {
  purple: "bg-purple-800/60 text-purple-300",
  teal:   "bg-teal-800/60 text-teal-300",
  blue:   "bg-blue-800/60 text-blue-300",
  amber:  "bg-amber-800/60 text-amber-300",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                        bg-purple-900/40 border border-purple-700/50 text-purple-300
                        text-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Live on Solana Devnet
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold mb-4 leading-tight">
          Australian Dollar<br />
          <span className="text-transparent bg-clip-text
                           bg-gradient-to-r from-purple-400 to-blue-400">
            on Solana
          </span>
        </h1>

        <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
          Real-world AUDD stablecoin infrastructure — payments, streaming
          salaries, merchant vaults and business treasury. All on-chain.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/pay/new"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500
                       text-white font-semibold rounded-xl transition">
            Create Payment
          </Link>
          <Link
            href="/merchant"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700
                       text-white font-semibold rounded-xl transition">
            Merchant Dashboard
          </Link>
        </div>
      </div>

      {/* Feature cards */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map(f => (
            <Link
              key={f.href}
              href={f.href}
              className={`p-6 rounded-2xl border transition
                          ${colorMap[f.color]}`}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{f.icon}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium
                                  ${tagColor[f.color]}`}>
                  {f.tag}
                </span>
              </div>
              <h2 className="font-bold text-lg text-white mb-1">{f.title}</h2>
              <p className="text-gray-400 text-sm">{f.description}</p>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-12 p-6 bg-gray-900 rounded-2xl border border-gray-800">
          <p className="text-center text-gray-500 text-sm mb-4">
            Built on Solana devnet
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: "Contracts",   value: "4" },
              { label: "Tests",       value: "16" },
              { label: "AUDD Mint",   value: "Devnet" },
              { label: "Program ID",  value: "HHawt..." },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-gray-500 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}