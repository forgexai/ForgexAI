import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getSolanaConnection } from "@/lib/solana-config";
import { MayanSolanaService } from "forgexai-sdk";

export async function POST(request: NextRequest) {
  try {
    const {
      amount,
      fromToken,
      toToken,
      fromChain,
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

    // Only support Solana as source chain for now
    if (fromChain !== "solana") {
      return NextResponse.json(
        { error: "Only Solana as source chain is currently supported" },
        { status: 400 }
      );
    }

    const connection = getSolanaConnection();
    const dummyWallet = new PublicKey("11111111111111111111111111111111");
    const mayanService = new MayanSolanaService(connection, dummyWallet);

    try {
      // Find the source token to get its contract address
      const sourceToken = await mayanService.findTokenBySymbol(fromToken);
      if (!sourceToken) {
        return NextResponse.json(
          { error: `Source token ${fromToken} not found on Solana` },
          { status: 400 }
        );
      }

      // Get real quote from Mayan Finance
      const mayanQuote = await mayanService.getQuote({
        amount,
        fromToken: sourceToken.contract,
        toToken: toToken.toLowerCase(), // Mayan expects lowercase symbols for destination
        toChain,
        slippage,
        gasDrop,
      });

      // Format the quote for frontend
      const quote = {
        inputAmount: amount,
        inputToken: fromToken,
        inputChain: fromChain,
        outputAmount:
          parseFloat(String(mayanQuote.expectedAmountOut || "0")) /
          Math.pow(10, 6), // Assuming 6 decimals for most tokens
        outputToken: toToken,
        outputChain: toChain,
        estimatedTime: getEstimatedTime(fromChain, toChain),
        bridgeFee: mayanQuote.bridgeFee || "0.1%",
        networkFee: getNetworkFee(fromChain, toChain),
        priceImpact: mayanQuote.priceImpact || "0.05%",
        route: `${fromChain} → ${toChain}`,
        slippage: `${slippage}%`,
        validUntil: new Date(Date.now() + 30000).toISOString(), // 30 seconds

        // Include raw Mayan quote for execution
        _mayanQuote: mayanQuote,
      };

      return NextResponse.json({
        success: true,
        quote,
        timestamp: new Date().toISOString(),
      });
    } catch (mayanError: any) {
      console.error("Mayan API error:", mayanError);

      return NextResponse.json({
        success: false,
        quote: null,
        fallback: true,
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
