export const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const config = {
  api: {
    baseURL,
    timeout: 30000,
  },
  frontend: {
    url: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
  },
  solana: {
    network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || "mainnet-beta",
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  },
} as const;
