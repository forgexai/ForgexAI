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

    // Filter out chains with no tokens (use only dynamic data)
    Object.keys(chainTokens).forEach(chain => {
      if (chainTokens[chain].length === 0) {
        console.warn(`No tokens found for chain: ${chain}`);
      }
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

    return NextResponse.json({
      success: false,
      error: `Failed to fetch tokens: ${error.message}`,
      tokens: {},
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
