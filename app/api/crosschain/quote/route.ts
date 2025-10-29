import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getSolanaConnection } from "@/lib/solana-config";
import { MayanSolanaService } from "@/lib/services/mayan";

// Token contract addresses for different chains
const CHAIN_TOKEN_CONTRACTS: { [chain: string]: { [symbol: string]: string } } = {
  ethereum: {
    ETH: "0x0000000000000000000000000000000000000000",
    USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  },
  arbitrum: {
    ETH: "0x0000000000000000000000000000000000000000",
    USDC: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    ARB: "0x912CE59144191C1204E64559FE8253a0e49E6548",
  },
  polygon: {
    MATIC: "0x0000000000000000000000000000000000000000",
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
  },
  bsc: {
    BNB: "0x0000000000000000000000000000000000000000",
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    CAKE: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
  },
  avalanche: {
    AVAX: "0x0000000000000000000000000000000000000000",
    USDC: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    USDT: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
    WAVAX: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
  },
};

/**
 * Resolve token symbol to contract address for a specific chain
 */
async function resolveTokenContract(tokenSymbol: string, chain: string): Promise<string> {
  const chainContracts = CHAIN_TOKEN_CONTRACTS[chain.toLowerCase()];
  if (!chainContracts) {
    throw new Error(`Chain ${chain} not supported`);
  }

  const contract = chainContracts[tokenSymbol.toUpperCase()];
  if (!contract) {
    throw new Error(`Token ${tokenSymbol} not supported on ${chain}`);
  }

  return contract;
}

export async function POST(request: NextRequest) {
  try {
    const {
      amount,
      fromToken,
      toToken,
      fromChain = "solana",
      toChain,
      slippage = 0.5,
      gasDrop,
    } = await request.json();

    if (!amount || !fromToken || !toToken || !fromChain || !toChain) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const connection = getSolanaConnection();
    const dummyWallet = new PublicKey("11111111111111111111111111111111");
    const mayanService = new MayanSolanaService(connection, dummyWallet);

    try {
      // For Solana as source chain, use the service directly
      if (fromChain === "solana") {
        // Find the source token
        const sourceToken = await mayanService.findTokenBySymbol(fromToken);
        if (!sourceToken) {
          return NextResponse.json(
            { error: `Source token ${fromToken} not found on ${fromChain}` },
            { status: 400 }
          );
        }

        // Resolve destination token contract address
        const toTokenContract = await resolveTokenContract(toToken, toChain);
        
        // Get real quote from Mayan Finance
        const mayanQuote = await mayanService.getQuote({
          amount,
          fromToken: sourceToken.contract,
          toToken: toTokenContract,
          toChain,
          slippage,
          gasDrop,
        });

        // Format the quote for frontend with proper decimal handling
        const rawOutputAmount = parseFloat(String(mayanQuote.expectedAmountOut || "0"));
        // The expectedAmountOut is already in the correct decimal format for most cases
        const formattedOutputAmount = rawOutputAmount;
        
        const quote = {
          inputAmount: amount,
          inputToken: fromToken,
          inputChain: fromChain,
          outputAmount: parseFloat(formattedOutputAmount.toFixed(8)), // Format to 8 decimal places max
          outputToken: toToken,
          outputChain: toChain,
          estimatedTime: getEstimatedTime(fromChain, toChain), // Use realistic bridge time, not just transaction time
          bridgeFee: mayanQuote.bridgeFee || "0.1%",
          networkFee: getNetworkFee(fromChain, toChain),
          priceImpact: mayanQuote.priceImpact || "0.05%",
          route: `${fromChain} → ${toChain}`,
          slippage: `${slippage}%`,
          validUntil: new Date(Date.now() + 30000).toISOString(),
          
          // Real pricing data from Mayan
          exchangeRate: `1 ${fromToken} = ${formattedOutputAmount.toFixed(4)} ${toToken}`,
          realPrice: mayanQuote.price,
          minReceived: mayanQuote.minReceived,

          // Include real Mayan quote for execution
          _mayanQuote: mayanQuote,
          _sourceToken: sourceToken,
        };

        return NextResponse.json({
          success: true,
          quote,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Get supported chains dynamically for better error message
        const supportedChains = await mayanService.getSupportedChains();

        return NextResponse.json(
          {
            error: `Cross-chain swaps from ${fromChain} are not yet supported in this API. Currently only Solana → other chains is supported.`,
            supportedFromChains: ["solana"],
            supportedToChains: supportedChains,
          },
          { status: 400 }
        );
      }
    } catch (mayanError: any) {
      console.error("Mayan API error:", mayanError);

      return NextResponse.json({
        success: false,
        error: `Failed to get quote: ${mayanError.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    console.error("Error getting cross-chain quote:", error);
    return NextResponse.json(
      { error: `Failed to get quote: ${error.message}` },
      { status: 500 }
    );
  }
}

function getEstimatedTime(fromChain: string, toChain: string): string {
  if (fromChain === "ethereum" || toChain === "ethereum") {
    return "10-20 minutes";
  }
  if (fromChain === "bsc" || toChain === "bsc") {
    return "3-8 minutes";
  }
  if (fromChain === "polygon" || toChain === "polygon") {
    return "2-6 minutes";
  }
  if (fromChain === "avalanche" || toChain === "avalanche") {
    return "2-5 minutes";
  }
  if (fromChain === "arbitrum" || toChain === "arbitrum") {
    return "5-12 minutes";
  }
  return "2-5 minutes";
}

function getNetworkFee(fromChain: string, toChain: string): string {
  if (fromChain === "solana") {
    return "~0.000005 SOL";
  }
  if (fromChain === "ethereum" || toChain === "ethereum") {
    return "~$5-15";
  }
  if (fromChain === "bsc" || toChain === "bsc") {
    return "~$0.50";
  }
  if (fromChain === "polygon" || toChain === "polygon") {
    return "~$0.10";
  }
  if (fromChain === "avalanche" || toChain === "avalanche") {
    return "~$0.25";
  }
  if (fromChain === "arbitrum" || toChain === "arbitrum") {
    return "~$1-3";
  }
  return "~$2.50";
}
