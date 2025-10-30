const hostname = typeof window !== "undefined" ? window.location.hostname : "";

export const baseURL = (() => {
  if (process.env.NEXT_PUBLIC_FRONTEND_URL) {
    return process.env.NEXT_PUBLIC_FRONTEND_URL;
  }

  if (hostname.includes("studio.forgexai.app")) {
    return "https://studio.forgexai.app";
  }

  if (hostname.includes("solana.forgexai.app")) {
    return "https://solana.forgexai.app";
  }

  return "https://forgexai.vercel.app";
})();

export const config = {
  api: {
    baseURL,
    timeout: 30000,
  },
  frontend: {
    url:
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      "https://forgex-ai-frontend.vercel.app",
  },
  solana: {
    network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || "mainnet-beta",
    rpcUrl:
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      "https://api.mainnet-beta.solana.com",
  },
} as const;
