import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SolanaWalletProvider } from "@/components/wallet/WalletProvider";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SolAUDD — Australian Dollar payments on Solana",
  description: "Pay, stream, and manage AUDD on-chain. Real-world finance infrastructure on Solana.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950`}>
        <SolanaWalletProvider>
          <Navbar />
          {children}
        </SolanaWalletProvider>
      </body>
    </html>
  );
}