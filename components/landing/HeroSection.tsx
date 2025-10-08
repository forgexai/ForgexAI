"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import WorkflowLoop from "./WorkflowLoop";

export default function HeroSection() {
  const phrases = [
    "Automate your DeFi strategies.",
    "Monitor your NFT floors.",
    "Stake smarter, trade faster.",
    "Govern with AI."
  ];
  
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const router = useRouter();
  const { authenticated, login, ready } = usePrivyAuth();

  const handleLaunchStudio = async () => {
    if (!ready) return;
    
    if (authenticated) {
      router.push('/dashboard');
    } else {
      await login();
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % phrases.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [phrases.length]);

  return (
    <section className="min-h-screen text-white relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-[#1a0033] via-[#2d1b69] to-[#0f172a] bg-[length:200%_200%]"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <div className="relative z-10 flex flex-col-reverse md:grid md:grid-cols-2 items-center gap-6 md:gap-10 px-4 md:px-6 lg:px-12 py-8 md:py-16 min-h-screen">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-lg">
          <Badge className="mb-6">Now in Beta</Badge>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight text-white drop-shadow-xl">
            Build Autonomous Solana Agents — <span className="text-[#ff6b35]">Visually.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mt-4 max-w-2xl">
            Drag, connect, and deploy AI agents that automate your on-chain world. No code. Fully non-custodial.
          </p>
          <div className="mt-6 h-8 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentPhrase}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="text-xl md:text-2xl font-semibold text-white"
              >
                {phrases[currentPhrase]}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="flex gap-4 mt-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                onClick={handleLaunchStudio}
                disabled={!ready}
                className="bg-gradient-to-r from-[#ff6b35] to-[#f7931e] cursor-pointer text-white border-0 hover:opacity-90"
              >
                Launch Studio
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-black hover:text-white cursor-pointer  hover:bg-clip-text hover:bg-gradient-to-r hover:from-[#9945FF] hover:via-[#14F195] hover:to-[#00BBFF]"
              >
                View Templates
              </Button>
            </motion.div>
          </div>
        </div>
        <WorkflowLoop />
      </div>
    </section>
  );
}
