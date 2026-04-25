import VaultDashboard from "@/components/merchant/VaultDashboard";
import Link from "next/link";

export default function MerchantPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-lg mx-auto">
        <Link
          href="/"
          className="text-gray-500 hover:text-white text-sm mb-6 block">
          {"<-"} Back
        </Link>
        <h1 className="text-3xl font-bold mb-2">Merchant Vault</h1>
        <p className="text-gray-400 mb-8">
          Accept AUDD payments. Share your QR code. Withdraw anytime.
        </p>
        <VaultDashboard />
      </div>
    </main>
  );
}