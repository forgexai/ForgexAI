import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { resolveAddressOrDomain } from "@/lib/address-resolver";

const connection = new Connection(
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  "confirmed"
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const account = searchParams.get("account");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 10;

    if (!account) {
      return NextResponse.json(
        { error: "Account address is required" },
        { status: 400 }
      );
    }

    // Resolve address or domain
    const publicKey = await resolveAddressOrDomain(account, connection);

    // Get recent transaction signatures
    const signatures = await connection.getSignaturesForAddress(
      publicKey,
      { limit },
      "confirmed"
    );

    if (signatures.length === 0) {
      return NextResponse.json({
        account: account,
        resolvedAddress: publicKey.toBase58(),
        transactions: [],
        count: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Get transaction details for each signature
    const transactions = [];
    for (const sigInfo of signatures) {
      try {
        const tx = await connection.getParsedTransaction(
          sigInfo.signature,
          { maxSupportedTransactionVersion: 0 }
        );

        if (!tx || !tx.meta) continue;

        // Basic transaction info
        const txData = {
          signature: sigInfo.signature,
          blockTime: sigInfo.blockTime ? new Date(sigInfo.blockTime * 1000).toISOString() : null,
          slot: sigInfo.slot,
          status: tx.meta.err ? "Failed" : "Success",
          fee: tx.meta.fee,
          computeUnitsConsumed: tx.meta.computeUnitsConsumed || 0,
          
          // SOL balance changes
          solChange: 0,
          
          // Programs involved
          programs: [] as string[],
          
          // Transaction type
          type: "Unknown",
          description: "",
        };

        // Calculate SOL balance change for this address
        const accountIndex = tx.transaction.message.accountKeys.findIndex(
          (key: any) => {
            const keyStr = typeof key === 'string' ? key : key.pubkey?.toString() || key.toString();
            return keyStr === publicKey.toBase58();
          }
        );

        if (accountIndex !== -1 && tx.meta.preBalances && tx.meta.postBalances) {
          const preBalance = tx.meta.preBalances[accountIndex] || 0;
          const postBalance = tx.meta.postBalances[accountIndex] || 0;
          txData.solChange = (postBalance - preBalance) / 1e9; // Convert to SOL
        }

        // Identify programs
        const programIds = new Set<string>();
        for (const instruction of tx.transaction.message.instructions) {
          let programId: any;
          if ('programIdIndex' in instruction && typeof instruction.programIdIndex === 'number') {
            programId = tx.transaction.message.accountKeys[instruction.programIdIndex];
          } else if ('program' in instruction) {
            programId = instruction.program;
          }
          
          const programIdStr = typeof programId === 'string' ? programId : programId?.pubkey?.toString() || programId?.toString();
          if (programIdStr) {
            programIds.add(programIdStr);
          }
        }

        // Map program IDs to readable names
        const programNames = Array.from(programIds).map(id => {
          const knownPrograms: Record<string, string> = {
            "11111111111111111111111111111111": "System Program",
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA": "Token Program",
            "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL": "Associated Token Program",
            "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4": "Jupiter V6",
            "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB": "Jupiter V4",
            "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": "Raydium AMM",
            "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM": "Raydium CLMM",
            "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD": "Marinade Finance",
            "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc": "Orca Whirlpools",
            "DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1": "Orca V1",
            "9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z": "Orca V2",
          };
          return knownPrograms[id] || `${id.slice(0, 8)}...`;
        });

        txData.programs = programNames;

        // Determine transaction type and description
        if (programNames.includes("Jupiter V6") || programNames.includes("Jupiter V4")) {
          txData.type = "Token Swap";
          txData.description = "Token swap via Jupiter aggregator";
        } else if (programNames.includes("Raydium AMM") || programNames.includes("Raydium CLMM")) {
          txData.type = "Token Swap";
          txData.description = "Token swap via Raydium DEX";
        } else if (programNames.includes("Marinade Finance")) {
          txData.type = "Liquid Staking";
          txData.description = "SOL staking/unstaking via Marinade Finance";
        } else if (programNames.includes("Orca Whirlpools") || programNames.includes("Orca V1") || programNames.includes("Orca V2")) {
          txData.type = "Token Swap";
          txData.description = "Token swap via Orca DEX";
        } else if (programNames.includes("Token Program")) {
          txData.type = "Token Transfer";
          txData.description = "Token transfer or mint/burn operation";
        } else if (programNames.includes("System Program")) {
          if (Math.abs(txData.solChange) > 0) {
            txData.type = "SOL Transfer";
            txData.description = `${txData.solChange > 0 ? 'Received' : 'Sent'} ${Math.abs(txData.solChange).toFixed(6)} SOL`;
          } else {
            txData.type = "System Operation";
            txData.description = "System program operation";
          }
        }

        transactions.push(txData);
      } catch (error) {
        console.warn(`Failed to parse transaction ${sigInfo.signature}:`, error);
        // Add basic info even if parsing fails
        transactions.push({
          signature: sigInfo.signature,
          blockTime: sigInfo.blockTime ? new Date(sigInfo.blockTime * 1000).toISOString() : null,
          slot: sigInfo.slot,
          status: sigInfo.err ? "Failed" : "Success",
          fee: 0,
          computeUnitsConsumed: 0,
          solChange: 0,
          programs: [],
          type: "Unknown",
          description: "Failed to parse transaction details",
        });
      }
    }

    return NextResponse.json({
      account: account,
      resolvedAddress: publicKey.toBase58(),
      transactions,
      count: transactions.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("Wallet history error:", error);
    return NextResponse.json(
      { error: `Failed to fetch wallet history: ${error.message}` },
      { status: 500 }
    );
  }
}
