import PaymentLinkCreator from "@/components/pay/PaymentLinkCreator";
import Link from "next/link";

export default function NewPaymentPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-lg mx-auto">
        <Link
          href="/"
          className="text-gray-500 hover:text-white text-sm mb-6 block"
        >
          &larr; Back
        </Link>
        <h1 className="text-3xl font-bold mb-2">Payment Link</h1>
        <p className="text-gray-400 mb-8">
          Lock AUDD in escrow. Share the link. Recipient claims when ready.
        </p>
        <PaymentLinkCreator />
      </div>
    </main>
  );
}