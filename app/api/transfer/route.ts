import { NextResponse } from "next/server";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, type Connection } from "@solana/web3.js";
import { getSolanaConnection } from "@/lib/solana-config";
import { resolveAddressOrDomain } from "@/lib/address-resolver";

export async function POST(request: Request) {
  try {
    const { toAddress, amount, userPublicKey } = await request.json();

    if (!toAddress || !amount) {
      return NextResponse.json(
        { error: "toAddress and amount are required" },
        { status: 400 }
      );
    }

    // Validate userPublicKey (required for external wallet)
    if (!userPublicKey) {
      return NextResponse.json(
        { error: "userPublicKey is required" },
        { status: 400 }
      );
    }

    const connection = getSolanaConnection();
    const fromPublicKey = new PublicKey(userPublicKey);

    // Resolve destination (address or domain)
    let destination: PublicKey;
    try {
      destination = await resolveAddressOrDomain(toAddress, connection);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid destination wallet or domain" },
        { status: 400 }
      );
    }

    const solAmount = parseFloat(amount);
    if (!Number.isFinite(solAmount) || solAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // Build transfer transaction
    const lamports = Math.round(solAmount * LAMPORTS_PER_SOL);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromPublicKey,
        toPubkey: destination,
        lamports,
      })
    );

    transaction.feePayer = fromPublicKey;
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    // Return unsigned transaction for client to sign (external wallet only)
    console.log("Prepared unsigned transfer transaction for client signing.");
    const serialized = transaction.serialize({ requireAllSignatures: false });
    const transferTransaction = Buffer.from(serialized).toString("base64");

    return NextResponse.json({
      success: true,
      transferTransaction, // base64 encoded unsigned transaction
      from: fromPublicKey.toString(),
      to: destination.toString(),
      amount: solAmount,
      unit: "SOL",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error sending SOL:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send SOL" },
      { status: 500 }
    );
  }
}


