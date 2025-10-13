import HeroSection from "@/components/landing/HeroSection";
import TrustedBy from "@/components/landing/TrustedBy";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solana Agent Studio — Build AI Agents for the On-Chain World",
  description: "A no-code platform to visually build, test, and deploy Solana AI agents with memory and Telegram integration.",
};

export default function Home() {
  return (
    <main className="bg-[#02021A] min-h-screen">
      <HeroSection />
      <TrustedBy />
    </main>
  );
}
