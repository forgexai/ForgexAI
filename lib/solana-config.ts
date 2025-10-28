import { Connection, Keypair } from "@solana/web3.js";

// External wallet configuration
// ForgeX AI only supports external wallets (Phantom/injected wallets) for security
// Server-side private keys are not supported
export const externalWallet = true;

// Token addresses
export const TOKENS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
} as const;

export const TOKEN_DECIMALS = {
  SOL: 9,
  USDC: 6,
  USDT: 6,
} as const;

// Liquid Staking Tokens (LST)
export const JUPSOL_MINT = "jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v"; // JupSOL mint
export const LST_DECIMALS = {
  JUPSOL: 9,
} as const;

// Initialize Solana connection
export function getSolanaConnection(): Connection {
  const rpcUrl =
    process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  return new Connection(rpcUrl, "confirmed");
}

// Get wallet keypair - DEPRECATED: ForgeX AI only supports external wallets
export function getWalletKeypair(): Keypair {
  throw new Error(
    "Server-side private keys are not supported. ForgeX AI only uses external wallets (Phantom, Solflare, etc.) for security."
  );
}

// Jupiter API endpoints (Free tier)
export const JUPITER_API = {
  QUOTE: "https://lite-api.jup.ag/swap/v1/quote",
  SWAP: "https://lite-api.jup.ag/swap/v1/swap",
  PRICE: "https://lite-api.jup.ag/price/v3",
  TOKEN_SEARCH: "https://lite-api.jup.ag/tokens/v2/search",
  TOKEN_LIST: "https://tokens.jup.ag/tokens",
} as const;

// Optional referral settings
export const JUP_REFERRAL_ADDRESS = "";
export const JUP_REFERRAL_FEE = 0;
