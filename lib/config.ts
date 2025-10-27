export const baseURL = process.env.NEXT_PUBLIC_API_URL || "https://forgex-ai-backend.vercel.app/api";

export const config = {
  api: {
    baseURL,
    timeout: 30000,
  },
  frontend: {
    url: process.env.NEXT_PUBLIC_FRONTEND_URL || "https://forgex-ai-frontend.vercel.app",
  },
  solana: {
    network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || "mainnet-beta",
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  },
} as const;
