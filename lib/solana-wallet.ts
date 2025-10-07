import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Keypair,
} from "@solana/web3.js";

const RPC_URL = "https://api.mainnet-beta.solana.com";
const connection = new Connection(RPC_URL, "confirmed");

/**
 * Fetch the SOL balance for a given wallet address
 * @param walletAddress - The public key of the wallet
 * @returns Promise<number> - Balance in SOL (not lamports)
 */
export async function fetchWalletBalance(walletAddress: string): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    throw new Error("Failed to fetch wallet balance");
  }
}

/**
 * Send SOL from one wallet to another
 * @param fromWallet - The sender's wallet keypair
 * @param toAddress - The recipient's public key as string
 * @param amount - Amount to send in SOL (not lamports)
 * @returns Promise<string> - Transaction signature
 */
export async function sendSOL(
  fromWallet: Keypair,
  toAddress: string,
  amount: number
): Promise<string> {
  try {
    const toPublicKey = new PublicKey(toAddress);
    const lamports = amount * LAMPORTS_PER_SOL;

    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: toPublicKey,
        lamports,
      })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromWallet.publicKey;

    // Send and confirm transaction
    const signature = await sendAndConfirmTransaction(connection, transaction, [fromWallet]);
    return signature;
  } catch (error) {
    console.error("Error sending SOL:", error);
    throw new Error("Failed to send SOL transaction");
  }
}

/**
 * Get the current SOL price or network info
 * @returns Promise<object> - Network information
 */
export async function getNetworkInfo() {
  try {
    const version = await connection.getVersion();
    const epochInfo = await connection.getEpochInfo();
    
    return {
      version: version["solana-core"],
      epoch: epochInfo.epoch,
      slot: epochInfo.slot,
      blockHeight: epochInfo.blockHeight,
    };
  } catch (error) {
    console.error("Error fetching network info:", error);
    throw new Error("Failed to fetch network information");
  }
}

/**
 * Convert lamports to SOL
 * @param lamports - Amount in lamports
 * @returns number - Amount in SOL
 */
export function lamportsToSOL(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

/**
 * Convert SOL to lamports
 * @param sol - Amount in SOL
 * @returns number - Amount in lamports
 */
export function solToLamports(sol: number): number {
  return sol * LAMPORTS_PER_SOL;
}
