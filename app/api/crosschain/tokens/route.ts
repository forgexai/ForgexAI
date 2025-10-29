import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getSolanaConnection } from "@/lib/solana-config";
import { MayanSolanaService } from "forgexai-sdk";

export async function GET() {
  try {
    const connection = getSolanaConnection();
    // Use a dummy public key for token fetching (doesn't require actual wallet)
    const dummyWallet = new PublicKey("11111111111111111111111111111111");
    const mayanService = new MayanSolanaService(connection, dummyWallet);

    // Get dynamic Solana tokens from Mayan Finance
    const [solanaTokens, solanaTokensSDK] = await Promise.all([
      mayanService.getAllSolanaTokens(true).catch(() => []),
      mayanService.getSolanaTokensFromSDK().catch(() => [])
    ]);

    // Format Solana tokens for frontend
    const formattedSolanaTokens = solanaTokens.map(token => ({
      symbol: token.symbol,
      name: token.name,
      mint: token.mint,
      decimals: token.decimals,
      verified: token.verified,
      logoURI: token.logoURI,
    }));

    // Add SDK tokens if available
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
        if (!allSolanaTokens.find(t => t.mint === sdkToken.mint)) {
          allSolanaTokens.push(sdkToken);
        }
      });
      formattedSolanaTokens.splice(0, formattedSolanaTokens.length, ...allSolanaTokens);
    }

    // Static tokens for other chains (these would ideally come from Mayan's multi-chain API)
    const chainTokens = {
      solana: formattedSolanaTokens.length > 0 ? formattedSolanaTokens : [
        { symbol: "SOL", name: "Solana", mint: "So11111111111111111111111111111111111111112", decimals: 9, verified: true },
        { symbol: "USDC", name: "USD Coin", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6, verified: true },
        { symbol: "USDT", name: "Tether", mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6, verified: true },
        { symbol: "BONK", name: "Bonk", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", decimals: 5, verified: true },
        { symbol: "WIF", name: "dogwifhat", mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", decimals: 6, verified: true },
        { symbol: "JUP", name: "Jupiter", mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", decimals: 6, verified: true },
      ],
      ethereum: [
        { symbol: "ETH", name: "Ethereum", address: "0x0000000000000000000000000000000000000000", decimals: 18, verified: true },
        { symbol: "USDC", name: "USD Coin", address: "0xA0b86a33E6441E13C7D3a0E8D3B3E8C8D3A0b86a33", decimals: 6, verified: true },
        { symbol: "USDT", name: "Tether", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6, verified: true },
        { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8, verified: true },
        { symbol: "DAI", name: "Dai Stablecoin", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18, verified: true },
      ],
      bsc: [
        { symbol: "BNB", name: "BNB", address: "0x0000000000000000000000000000000000000000", decimals: 18, verified: true },
        { symbol: "USDT", name: "Tether", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18, verified: true },
        { symbol: "BUSD", name: "Binance USD", address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", decimals: 18, verified: true },
        { symbol: "CAKE", name: "PancakeSwap", address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", decimals: 18, verified: true },
      ],
      polygon: [
        { symbol: "MATIC", name: "Polygon", address: "0x0000000000000000000000000000000000000000", decimals: 18, verified: true },
        { symbol: "USDC", name: "USD Coin", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", decimals: 6, verified: true },
        { symbol: "USDT", name: "Tether", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6, verified: true },
        { symbol: "WETH", name: "Wrapped Ethereum", address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", decimals: 18, verified: true },
      ],
      avalanche: [
        { symbol: "AVAX", name: "Avalanche", address: "0x0000000000000000000000000000000000000000", decimals: 18, verified: true },
        { symbol: "USDC", name: "USD Coin", address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6, verified: true },
        { symbol: "USDT", name: "Tether", address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", decimals: 6, verified: true },
        { symbol: "WAVAX", name: "Wrapped AVAX", address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", decimals: 18, verified: true },
      ],
      arbitrum: [
        { symbol: "ETH", name: "Ethereum", address: "0x0000000000000000000000000000000000000000", decimals: 18, verified: true },
        { symbol: "USDC", name: "USD Coin", address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", decimals: 6, verified: true },
        { symbol: "USDT", name: "Tether", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6, verified: true },
        { symbol: "ARB", name: "Arbitrum", address: "0x912CE59144191C1204E64559FE8253a0e49E6548", decimals: 18, verified: true },
      ],
    };

    return NextResponse.json({
      success: true,
      tokens: chainTokens,
      solanaTokenCount: formattedSolanaTokens.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("Error fetching chain tokens:", error);
    
    // Fallback to static tokens if Mayan API fails
    const fallbackTokens = {
      solana: [
        { symbol: "SOL", name: "Solana", mint: "So11111111111111111111111111111111111111112", decimals: 9, verified: true },
        { symbol: "USDC", name: "USD Coin", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6, verified: true },
        { symbol: "USDT", name: "Tether", mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6, verified: true },
      ],
      ethereum: [
        { symbol: "ETH", name: "Ethereum", address: "0x0000000000000000000000000000000000000000", decimals: 18, verified: true },
        { symbol: "USDC", name: "USD Coin", address: "0xA0b86a33E6441E13C7D3a0E8D3B3E8C8D3A0b86a33", decimals: 6, verified: true },
      ],
      bsc: [
        { symbol: "BNB", name: "BNB", address: "0x0000000000000000000000000000000000000000", decimals: 18, verified: true },
        { symbol: "USDT", name: "Tether", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18, verified: true },
      ],
      polygon: [
        { symbol: "MATIC", name: "Polygon", address: "0x0000000000000000000000000000000000000000", decimals: 18, verified: true },
        { symbol: "USDC", name: "USD Coin", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", decimals: 6, verified: true },
      ],
      avalanche: [
        { symbol: "AVAX", name: "Avalanche", address: "0x0000000000000000000000000000000000000000", decimals: 18, verified: true },
        { symbol: "USDC", name: "USD Coin", address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6, verified: true },
      ],
      arbitrum: [
        { symbol: "ETH", name: "Ethereum", address: "0x0000000000000000000000000000000000000000", decimals: 18, verified: true },
        { symbol: "USDC", name: "USD Coin", address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", decimals: 6, verified: true },
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
