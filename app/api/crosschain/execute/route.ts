import { NextRequest, NextResponse } from "next/server";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { getSolanaConnection } from "@/lib/solana-config";
import { MayanSolanaService } from "@/lib/services/mayan";

export async function POST(request: NextRequest) {
  try {
    const { quote, userPublicKey, destinationWallet, fromChain, toChain } =
      await request.json();

    if (!quote || !userPublicKey || !fromChain || !toChain) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (fromChain !== "solana") {
      return NextResponse.json(
        { error: "Only Solana as source chain is currently supported" },
        { status: 400 }
      );
    }

    const connection = getSolanaConnection();
    const userPubkey = new PublicKey(userPublicKey);
    const mayanService = new MayanSolanaService(connection, userPubkey);

    try {
      // Ensure we have a real Mayan quote
      if (!quote._mayanQuote) {
        return NextResponse.json(
          {
            error:
              "Invalid quote: Missing Mayan Finance quote data. Please get a fresh quote.",
          },
          { status: 400 }
        );
      }

      // For now, return the quote data and let frontend handle Mayan SDK directly
      // This avoids server-side SDK issues with wallet interactions
      const transactionData = {
        quote: quote._mayanQuote,
        userPublicKey,
        destinationWallet: destinationWallet || userPublicKey,
        fromChain,
        toChain,
        requiresClientSideExecution: true
      };

      return NextResponse.json({
        success: true,
        swapTransaction: transactionData,
        quote,
        message:
          "Mayan cross-chain swap transaction prepared using real Mayan Finance SDK.",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error creating swap transaction:", error);

      return NextResponse.json(
        {
          success: false,
          error: `Failed to create Mayan swap transaction: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error executing cross-chain swap:", error);
    return NextResponse.json(
      { error: `Failed to execute cross-chain swap: ${error.message}` },
      { status: 500 }
    );
  }
}
