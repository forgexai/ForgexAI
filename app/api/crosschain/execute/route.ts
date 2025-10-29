import { NextRequest, NextResponse } from "next/server";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { getSolanaConnection } from "@/lib/solana-config";
import { MayanSolanaService } from "forgexai-sdk";

export async function POST(request: NextRequest) {
  try {
    const { quote, userPublicKey, destinationWallet, fromChain, toChain } = await request.json();

    if (!quote || !userPublicKey || !fromChain || !toChain) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // For now, only support Solana as the source chain
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
      // Check if we have a real Mayan quote
      if (quote._mayanQuote && !quote._fallback) {
        // Use real Mayan Finance SDK to create swap instructions
        const swapInstructions = await mayanService.createSwapInstructions(
          quote._mayanQuote,
          destinationWallet || userPublicKey,
          null // No referrer for now
        );

        // Create a versioned transaction with the swap instructions
        const { blockhash } = await connection.getLatestBlockhash();
        
        // For now, create a simple transaction with the instructions
        // In production, you'd use the full Mayan SDK transaction building
        const transaction = new VersionedTransaction({
          instructions: swapInstructions.instructions,
          recentBlockhash: blockhash,
          feePayer: userPubkey,
        } as any);

        // Serialize the transaction for client signing
        const serializedTransaction = transaction.serialize();

        return NextResponse.json({
          success: true,
          swapTransaction: Buffer.from(serializedTransaction).toString('base64'),
          quote,
          message: "Real Mayan cross-chain swap transaction prepared.",
          timestamp: new Date().toISOString(),
        });

      } else {
        // Fallback: Create a demo transaction for testing
        const { Transaction, SystemProgram } = await import("@solana/web3.js");
        const transaction = new Transaction();
        
        // Add a memo instruction to represent the cross-chain swap
        const memoInstruction = {
          keys: [],
          programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
          data: Buffer.from(`Mayan Cross-chain Swap: ${quote.inputAmount} ${quote.inputToken} -> ${quote.outputAmount} ${quote.outputToken} (${fromChain} -> ${toChain})`),
        };
        
        transaction.add(memoInstruction);
        
        // Add a small SOL transfer to make it a valid transaction
        const transferInstruction = SystemProgram.transfer({
          fromPubkey: userPubkey,
          toPubkey: userPubkey, // Self-transfer for demo
          lamports: 1, // 1 lamport
        });
        
        transaction.add(transferInstruction);
        
        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = userPubkey;

        // Serialize the transaction for client signing
        const serializedTransaction = transaction.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        });

        return NextResponse.json({
          success: true,
          swapTransaction: Buffer.from(serializedTransaction).toString('base64'),
          quote,
          message: quote._fallback 
            ? "Demo cross-chain swap transaction (Mayan API unavailable)." 
            : "Demo cross-chain swap transaction prepared.",
          timestamp: new Date().toISOString(),
        });
      }

    } catch (error: any) {
      console.error("Error creating swap transaction:", error);
      
      // Fallback to demo transaction if Mayan SDK fails
      const { Transaction, SystemProgram } = await import("@solana/web3.js");
      const transaction = new Transaction();
      
      const memoInstruction = {
        keys: [],
        programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
        data: Buffer.from(`Mayan Cross-chain Swap (Fallback): ${quote.inputAmount} ${quote.inputToken} -> ${quote.outputAmount} ${quote.outputToken}`),
      };
      
      transaction.add(memoInstruction);
      
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: userPubkey,
        lamports: 1,
      });
      
      transaction.add(transferInstruction);
      
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPubkey;

      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      return NextResponse.json({
        success: true,
        swapTransaction: Buffer.from(serializedTransaction).toString('base64'),
        quote,
        message: "Fallback demo transaction (Mayan SDK error).",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

  } catch (error: any) {
    console.error("Error executing cross-chain swap:", error);
    return NextResponse.json(
      { error: `Failed to execute cross-chain swap: ${error.message}` },
      { status: 500 }
    );
  }
}
