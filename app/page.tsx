import HeroSection from "@/components/landing/HeroSection";
import TrustedBy from "@/components/landing/TrustedBy";
import { Metadata } from "next";

import {
  useWidgetProps,
  useMaxHeight,
  useDisplayMode,
  useRequestDisplayMode,
  useIsChatGptApp,
} from "./hooks";

export const metadata: Metadata = {
  title: "Solana Agent Studio — Build AI Agents for the On-Chain World",
  description:
    "A no-code platform to visually build, test, and deploy Solana AI agents with memory and Telegram integration.",
};

export default function Home() {
  const toolOutput = useWidgetProps<{
    name?: string;
    result?: { structuredContent?: { name?: string } };
  }>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();
  const requestDisplayMode = useRequestDisplayMode();
  const isChatGptApp = useIsChatGptApp();

  console.log("Tool Output:", toolOutput);
  console.log("Max Height:", maxHeight);
  console.log("Display Mode:", displayMode);
  console.log("Request Display Mode:", requestDisplayMode);
  console.log("Is ChatGPT App:", isChatGptApp);

  const name = toolOutput?.result?.structuredContent?.name || toolOutput?.name;

  return (
    <main className="bg-[#02021A] min-h-screen overflow-x-hidden">
      <HeroSection />
      <TrustedBy />
    </main>
  );
}
