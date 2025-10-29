import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getSolanaConnection } from "@/lib/solana-config";
import { MayanSolanaService } from "@/lib/services/mayan";

export async function GET() {
  try {
    const connection = getSolanaConnection();
    const dummyWallet = new PublicKey("11111111111111111111111111111111");
    const mayanService = new MayanSolanaService(connection, dummyWallet);

    // Get supported chains dynamically from Mayan Finance
    const supportedChains = await mayanService.getSupportedChains();
    const allChains = ["solana", ...supportedChains];

    // Fetch tokens for all supported chains dynamically
    const chainTokenPromises = allChains.map(async (chain) => {
      if (chain === "solana") {
        // For Solana, use both API and SDK methods
        const [solanaTokens, solanaTokensSDK] = await Promise.all([
          mayanService.getAllSolanaTokens(true).catch(() => []),
          mayanService.getSolanaTokensFromSDK().catch(() => []),
        ]);

        // Format Solana tokens
        const formattedSolanaTokens = solanaTokens.map((token) => ({
          symbol: token.symbol,
          name: token.name,
          mint: token.mint,
          decimals: token.decimals,
          verified: token.verified,
          logoURI: token.logoURI,
        }));

        // Merge SDK tokens if available
        if (solanaTokensSDK.length > 0) {
          const sdkTokens = solanaTokensSDK.map((token: any) => ({
            symbol: token.symbol,
            name: token.name,
            mint: token.mint || token.contract,
            decimals: token.decimals,
            verified: token.verified || false,
            logoURI: token.logoURI,
          }));

          // Merge and deduplicate
          const allSolanaTokens = [...formattedSolanaTokens];
          sdkTokens.forEach((sdkToken: any) => {
            if (!allSolanaTokens.find((t) => t.mint === sdkToken.mint)) {
              allSolanaTokens.push(sdkToken);
            }
          });
          return { chain, tokens: allSolanaTokens };
        }

        return { chain, tokens: formattedSolanaTokens };
      } else {
        // For other chains, fetch tokens dynamically from Mayan API
        const chainTokens = await mayanService.getTokensForChain(chain);
        const formattedTokens = chainTokens.map((token: any) => ({
          symbol: token.symbol,
          name: token.name,
          address: token.contract || token.address,
          decimals: token.decimals,
          verified: token.verified || false,
          logoURI: token.logoURI,
        }));
        return { chain, tokens: formattedTokens };
      }
    });

    // Wait for all chain token fetches to complete
    const chainResults = await Promise.all(chainTokenPromises);
    
    // Build dynamic chain tokens object
    const chainTokens: { [key: string]: any[] } = {};
    chainResults.forEach(({ chain, tokens }) => {
      chainTokens[chain] = tokens;
    });

    // Ensure we have at least basic tokens for each chain if API fails
    const ensureMinimalTokens = (chain: string, tokens: any[]) => {
      if (tokens.length > 0) return tokens;
      
      // Minimal fallback tokens only if API completely fails
      const fallbackTokens: { [key: string]: any[] } = {
        solana: [
          { symbol: "SOL", name: "Solana", mint: "So11111111111111111111111111111111111111112", decimals: 9, verified: true },
          { symbol: "USDC", name: "USD Coin", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6, verified: true },
        ],
        ethereum: [
          { symbol: "ETH", name: "Ethereum", address: "0x0000000000000000000000000000000000000000", decimals: 18, verified: true },
          { symbol: "USDC", name: "USD Coin", address: "0xA0b86a33E6441E13C7D3a0E8D3B3E8C8D3A0b86a33", decimals: 6, verified: true },
        ],
      };
      return fallbackTokens[chain] || [];
    };

    // Apply minimal fallbacks only where needed
    Object.keys(chainTokens).forEach(chain => {
      chainTokens[chain] = ensureMinimalTokens(chain, chainTokens[chain]);
    });

    return NextResponse.json({
      success: true,
      tokens: chainTokens,
      supportedChains: allChains,
      dynamicTokenCount: Object.keys(chainTokens).reduce((total, chain) => total + chainTokens[chain].length, 0),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching chain tokens:", error);

    // Fallback to static tokens if Mayan API fails
    const fallbackTokens = {
      solana: [
        {
          symbol: "SOL",
          name: "Solana",
          mint: "So11111111111111111111111111111111111111112",
          decimals: 9,
          verified: true,
        },
        {
          symbol: "USDC",
          name: "USD Coin",
          mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          decimals: 6,
          verified: true,
        },
        {
          symbol: "USDT",
          name: "Tether",
          mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
          decimals: 6,
          verified: true,
        },
      ],
      ethereum: [
        {
          symbol: "ETH",
          name: "Ethereum",
          address: "0x0000000000000000000000000000000000000000",
          decimals: 18,
          verified: true,
        },
        {
          symbol: "USDC",
          name: "USD Coin",
          address: "0xA0b86a33E6441E13C7D3a0E8D3B3E8C8D3A0b86a33",
          decimals: 6,
          verified: true,
        },
      ],
      bsc: [
        {
          symbol: "BNB",
          name: "BNB",
          address: "0x0000000000000000000000000000000000000000",
          decimals: 18,
          verified: true,
        },
        {
          symbol: "USDT",
          name: "Tether",
          address: "0x55d398326f99059fF775485246999027B3197955",
          decimals: 18,
          verified: true,
        },
      ],
      polygon: [
        {
          symbol: "MATIC",
          name: "Polygon",
          address: "0x0000000000000000000000000000000000000000",
          decimals: 18,
          verified: true,
        },
        {
          symbol: "USDC",
          name: "USD Coin",
          address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
          decimals: 6,
          verified: true,
        },
      ],
      avalanche: [
        {
          symbol: "AVAX",
          name: "Avalanche",
          address: "0x0000000000000000000000000000000000000000",
          decimals: 18,
          verified: true,
        },
        {
          symbol: "USDC",
          name: "USD Coin",
          address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
          decimals: 6,
          verified: true,
        },
      ],
      arbitrum: [
        {
          symbol: "ETH",
          name: "Ethereum",
          address: "0x0000000000000000000000000000000000000000",
          decimals: 18,
          verified: true,
        },
        {
          symbol: "USDC",
          name: "USD Coin",
          address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
          decimals: 6,
          verified: true,
        },
      ],
    };

    return NextResponse.json({
      success: true,
      tokens: fallbackTokens,
      fallback: true,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
