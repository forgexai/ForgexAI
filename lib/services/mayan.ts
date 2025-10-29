import {
  Connection,
  PublicKey,
  Keypair,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  fetchQuote,
  swapFromSolana,
  Quote,
  ReferrerAddresses,
  SolanaTransactionSigner,
  fetchTokenList,
  getCurrentChainTime,
  getSuggestedRelayer,
  createSwapFromSolanaInstructions,
  wrapSol,
  unwrapSol,
  getAssociatedTokenAddress as getAssociatedTokenAddr,
  createAssociatedTokenAccountInstruction as createATAInstruction,
  createApproveInstruction as createApprove,
  createCloseAccountInstruction as createClose,
  createSyncNativeInstruction as createSync,
  solMint,
  SolanaBridgeOptions,
} from "@mayanfinance/swap-sdk";
import axios, { AxiosInstance } from "axios";

/**
 * Token standard types supported by Mayan on Solana
 */
export type SolanaTokenStandard = "native" | "spl" | "spl2022";

/**
 * Mayan token metadata interface
 */
export interface MayanToken {
  name: string;
  standard: SolanaTokenStandard;
  symbol: string;
  mint: string;
  verified: boolean;
  contract: string;
  chainId: number;
  wChainId: number;
  decimals: number;
  logoURI: string;
  coingeckoId?: string;
  pythUsdPriceId?: string;
  realOriginContractAddress: string;
  realOriginChainId: number;
  supportsPermit: boolean;
  wrappedAddress?: string;
  hasAuction?: boolean;
}

/**
 * Mayan swap transaction status
 */
export interface MayanSwapStatus {
  id: string;
  trader: string;
  sourceTxHash: string;
  sourceTxBlockNo: number;
  status: string;
  transferSequence: string;
  swapSequence: string;
  deadline: string;
  sourceChain: string;
  swapChain: string;
  destChain: string;
  destAddress: string;
  fromTokenAddress: string;
  fromTokenChain: string;
  fromTokenSymbol: string;
  fromAmount: string;
  toTokenAddress: string;
  toTokenChain: string;
  toTokenSymbol: string;
  toAmount: string;
  transferSignedVaa?: string;
  swapSignedVaa?: string;
  savedAt: string;
  initiatedAt: string;
  completedAt?: string;
  insufficientFees: boolean;
  retries: number;
  swapRelayerFee: string;
  redeemRelayerFee: string;
  refundRelayerFee: string;
  statusUpdatedAt: string;
  bridgeFee: string;
  sourceTxFee: string;
  fromTokenLogoUri: string;
  toTokenLogoUri: string;
  fromTokenScannerUrl: string;
  toTokenScanner: string;
}

/**
 * Comprehensive Mayan Finance Solana Service
 * Handles cross-chain swaps, token listing, transaction tracking, and advanced Solana operations
 */
export class MayanSolanaService {
  private connection: Connection;
  private originWallet: PublicKey;
  private priceApiClient: AxiosInstance;
  private explorerApiClient: AxiosInstance;

  // API Base URLs
  private static readonly PRICE_API_BASE = "https://price-api.mayan.finance";
  private static readonly EXPLORER_API_BASE =
    "https://explorer-api.mayan.finance";

  /**
   * Gas on destination limits for each chain
   */
  static readonly GAS_DROP_LIMITS = {
    ethereum: 0.05,
    bsc: 0.02,
    polygon: 0.2,
    avalanche: 0.2,
    solana: 0.2,
    arbitrum: 0.01,
  };

  /**
   * @param connection Solana RPC connection
   * @param originWalletAddress Originating Solana wallet public key
   */
  constructor(connection: Connection, originWalletAddress: PublicKey) {
    this.connection = connection;
    this.originWallet = originWalletAddress;

    // Initialize API clients
    this.priceApiClient = axios.create({
      baseURL: MayanSolanaService.PRICE_API_BASE,
      timeout: 30000,
    });

    this.explorerApiClient = axios.create({
      baseURL: MayanSolanaService.EXPLORER_API_BASE,
      timeout: 30000,
    });
  }

  // ============================================
  // TOKEN LISTING & DISCOVERY
  // ============================================

  /**
   * Get all supported chains from Mayan Finance
   */
  async getSupportedChains(): Promise<string[]> {
    try {
      const response = await this.priceApiClient.get("/v3/chains");
      return response.data.chains || ["ethereum", "bsc", "polygon", "avalanche", "arbitrum"];
    } catch (error) {
      console.warn("Failed to fetch supported chains, using defaults:", error);
      return ["ethereum", "bsc", "polygon", "avalanche", "arbitrum"];
    }
  }

  /**
   * Get tokens for a specific chain
   */
  async getTokensForChain(chain: string): Promise<any[]> {
    try {
      const response = await this.priceApiClient.get("/v3/tokens", {
        params: {
          chain,
          nonPortal: true,
        },
      });
      return response.data[chain] || [];
    } catch (error) {
      console.warn(`Failed to fetch tokens for ${chain}:`, error);
      return [];
    }
  }

  /**
   * Get all supported Solana tokens using SDK
   */
  async getSolanaTokensFromSDK(): Promise<any[]> {
    try {
      return await fetchTokenList("solana", true);
    } catch (error) {
      throw this.handleError("getSolanaTokensFromSDK", error);
    }
  }

  /**
   * Get all supported Solana tokens by standard
   * @param standard Token standard: "native" | "spl" | "spl2022"
   * @param nonPortal Only return non-portal tokens (default: true)
   */
  async getSolanaTokens(
    standard: SolanaTokenStandard = "spl",
    nonPortal = true
  ): Promise<MayanToken[]> {
    try {
      const response = await this.priceApiClient.get("/v3/tokens", {
        params: {
          chain: "solana",
          standard,
          nonPortal,
        },
      });

      return response.data.solana || [];
    } catch (error) {
      throw this.handleError("getSolanaTokens", error);
    }
  }

  /**
   * Get native SOL token info
   */
  async getNativeSOL(): Promise<MayanToken | null> {
    try {
      const tokens = await this.getSolanaTokens("native");
      return tokens.find((t) => t.symbol === "SOL") || null;
    } catch (error) {
      throw this.handleError("getNativeSOL", error);
    }
  }

  /**
   * Get all SPL tokens (standard SPL)
   */
  async getSPLTokens(nonPortal = true): Promise<MayanToken[]> {
    return await this.getSolanaTokens("spl", nonPortal);
  }

  /**
   * Get all SPL2022 tokens (Token-2022 standard)
   */
  async getSPL2022Tokens(nonPortal = true): Promise<MayanToken[]> {
    return await this.getSolanaTokens("spl2022", nonPortal);
  }

  /**
   * Get all Solana tokens across all standards
   */
  async getAllSolanaTokens(nonPortal = true): Promise<MayanToken[]> {
    try {
      const [native, spl, spl2022] = await Promise.all([
        this.getSolanaTokens("native", nonPortal),
        this.getSolanaTokens("spl", nonPortal),
        this.getSolanaTokens("spl2022", nonPortal),
      ]);

      return [...native, ...spl, ...spl2022];
    } catch (error) {
      throw this.handleError("getAllSolanaTokens", error);
    }
  }

  /**
   * Search for a token by symbol
   */
  async findTokenBySymbol(symbol: string): Promise<MayanToken | null> {
    try {
      const allTokens = await this.getAllSolanaTokens();
      return (
        allTokens.find(
          (t) => t.symbol.toLowerCase() === symbol.toLowerCase()
        ) || null
      );
    } catch (error) {
      throw this.handleError("findTokenBySymbol", error);
    }
  }

  /**
   * Search for a token by mint address
   */
  async findTokenByMint(mint: string): Promise<MayanToken | null> {
    try {
      const allTokens = await this.getAllSolanaTokens();
      return allTokens.find((t) => t.mint === mint) || null;
    } catch (error) {
      throw this.handleError("findTokenByMint", error);
    }
  }

  /**
   * Get verified tokens only
   */
  async getVerifiedTokens(): Promise<MayanToken[]> {
    try {
      const allTokens = await this.getAllSolanaTokens();
      return allTokens.filter((t) => t.verified);
    } catch (error) {
      throw this.handleError("getVerifiedTokens", error);
    }
  }

  /**
   * Get tokens with auction support
   */
  async getAuctionTokens(): Promise<MayanToken[]> {
    try {
      const allTokens = await this.getAllSolanaTokens();
      return allTokens.filter((t) => t.hasAuction);
    } catch (error) {
      throw this.handleError("getAuctionTokens", error);
    }
  }

  // ============================================
  // SWAP OPERATIONS
  // ============================================

  /**
   * Get swap quote from Solana to another chain
   * @param params Quote parameters
   */
  async getQuote(params: {
    amount: number;
    fromToken: string;
    toToken: string;
    toChain: string;
    slippage?: number;
    gasDrop?: number;
    referrerAddress?: string; // Single Solana address for referral
  }): Promise<Quote> {
    try {
      // Validate gasDrop against chain limits
      if (params.gasDrop && params.toChain) {
        const limit =
          MayanSolanaService.GAS_DROP_LIMITS[
            params.toChain as keyof typeof MayanSolanaService.GAS_DROP_LIMITS
          ];
        if (limit && params.gasDrop > limit) {
          console.warn(
            `gasDrop ${params.gasDrop} exceeds limit ${limit} for ${params.toChain}`
          );
        }
      }

      // Create referrer object with Solana address only
      const referrerObj: ReferrerAddresses | undefined = params.referrerAddress
        ? {
            solana: params.referrerAddress,
            evm: null,
            sui: null,
          }
        : undefined;

      const quotes = await fetchQuote({
        amount: params.amount,
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromChain: "solana",
        toChain: params.toChain as any,
        slippageBps: Math.round((params.slippage ?? 3) * 100),
        gasDrop: params.gasDrop,
        referrer: referrerObj?.solana ?? undefined,
      });

      if (!quotes || quotes.length === 0) {
        throw new Error("No quotes returned from fetchQuote");
      }

      return quotes[0];
    } catch (error) {
      throw this.handleError("getQuote", error);
    }
  }

  /**
   * Execute swap from Solana
   * @param quote Quote from getQuote
   * @param destinationWallet Destination wallet address
   * @param referrerAddress Optional referrer address for fees
   * @param signTransaction Function to sign transaction
   */
  async swap(
    quote: Quote,
    destinationWallet: string,
    referrerAddress: string | null,
    signTransaction: SolanaTransactionSigner
  ): Promise<{ signature: string; serializedTrx: Uint8Array | null }> {
    try {
      // Create referrer object
      const referrerObj: ReferrerAddresses | null = referrerAddress
        ? {
            solana: referrerAddress,
            evm: null,
            sui: null,
          }
        : null;

      return await swapFromSolana(
        quote,
        this.originWallet.toBase58(),
        destinationWallet,
        referrerObj,
        signTransaction,
        this.connection
      );
    } catch (error) {
      throw this.handleError("swap", error);
    }
  }

  /**
   * Complete swap workflow: get quote and execute
   */
  async executeSwap(params: {
    amount: number;
    fromTokenSymbol: string;
    toTokenSymbol: string;
    toChain: string;
    destinationWallet: string;
    slippage?: number;
    gasDrop?: number;
    referrerAddress?: string;
    signTransaction: SolanaTransactionSigner;
  }): Promise<{
    quote: Quote;
    transaction: { signature: string; serializedTrx: Uint8Array | null };
  }> {
    try {
      // Find tokens
      const fromToken = await this.findTokenBySymbol(params.fromTokenSymbol);
      if (!fromToken) {
        throw new Error(`Token ${params.fromTokenSymbol} not found`);
      }

      // Get quote
      const quote = await this.getQuote({
        amount: params.amount,
        fromToken: fromToken.contract,
        toToken: params.toTokenSymbol,
        toChain: params.toChain,
        slippage: params.slippage,
        gasDrop: params.gasDrop,
        referrerAddress: params.referrerAddress,
      });

      // Execute swap
      const transaction = await this.swap(
        quote,
        params.destinationWallet,
        params.referrerAddress || null,
        params.signTransaction
      );

      return { quote, transaction };
    } catch (error) {
      throw this.handleError("executeSwap", error);
    }
  }

  /**
   * Create swap instructions without executing
   */
  async createSwapInstructions(
    quote: Quote,
    destinationWallet: string,
    referrerAddress: string | null,
    options?: SolanaBridgeOptions
  ): Promise<{
    instructions: TransactionInstruction[];
    signers: Keypair[];
    lookupTables: any[];
    swapMessageV0Params: any;
  }> {
    try {
      const referrerObj: ReferrerAddresses | null = referrerAddress
        ? {
            solana: referrerAddress,
            evm: null,
            sui: null,
          }
        : null;

      return await createSwapFromSolanaInstructions(
        quote,
        this.originWallet.toBase58(),
        destinationWallet,
        referrerObj,
        this.connection,
        options
      );
    } catch (error) {
      throw this.handleError("createSwapInstructions", error);
    }
  }

  // ============================================
  // ADVANCED SOLANA OPERATIONS
  // ============================================

  /**
   * Wrap SOL to wSOL
   */
  async wrapSOL(
    amount: number,
    signTransaction: SolanaTransactionSigner
  ): Promise<{ signature: string; serializedTrx: Uint8Array }> {
    try {
      return await wrapSol(
        this.originWallet,
        amount,
        signTransaction,
        this.connection
      );
    } catch (error) {
      throw this.handleError("wrapSOL", error);
    }
  }

  /**
   * Unwrap wSOL to SOL
   */
  async unwrapSOL(
    amount: number,
    signTransaction: SolanaTransactionSigner
  ): Promise<{ signature: string; serializedTrx: Uint8Array }> {
    try {
      return await unwrapSol(
        this.originWallet,
        amount,
        signTransaction,
        this.connection
      );
    } catch (error) {
      throw this.handleError("unwrapSOL", error);
    }
  }

  /**
   * Get associated token address for a mint
   */
  getAssociatedTokenAddress(
    mint: PublicKey,
    owner: PublicKey,
    allowOwnerOffCurve = false
  ): PublicKey {
    return getAssociatedTokenAddr(mint, owner, allowOwnerOffCurve);
  }

  /**
   * Create associated token account instruction
   */
  createAssociatedTokenAccountInstruction(
    payer: PublicKey,
    associatedToken: PublicKey,
    owner: PublicKey,
    mint: PublicKey
  ): TransactionInstruction {
    return createATAInstruction(payer, associatedToken, owner, mint);
  }

  /**
   * Create approve instruction for token delegation
   */
  createApproveInstruction(
    account: PublicKey,
    delegate: PublicKey,
    owner: PublicKey,
    amount: bigint
  ): TransactionInstruction {
    return createApprove(account, delegate, owner, amount);
  }

  /**
   * Create close account instruction
   */
  createCloseAccountInstruction(
    account: PublicKey,
    destination: PublicKey,
    owner: PublicKey
  ): TransactionInstruction {
    return createClose(account, destination, owner);
  }

  /**
   * Create sync native instruction for wSOL accounts
   */
  createSyncNativeInstruction(account: PublicKey): TransactionInstruction {
    return createSync(account);
  }

  /**
   * Get SOL mint address
   */
  static getSolMint(): PublicKey {
    return solMint;
  }

  /**
   * Get current chain time
   */
  async getCurrentChainTime(chain: string): Promise<number> {
    try {
      return await getCurrentChainTime(chain as any);
    } catch (error) {
      throw this.handleError("getCurrentChainTime", error);
    }
  }

  /**
   * Get suggested relayer address
   */
  async getSuggestedRelayer(): Promise<string> {
    try {
      return await getSuggestedRelayer();
    } catch (error) {
      throw this.handleError("getSuggestedRelayer", error);
    }
  }

  // ============================================
  // TRANSACTION TRACKING
  // ============================================

  /**
   * Track swap transaction by source transaction hash
   * @param txHash Source transaction hash
   */
  async trackSwap(txHash: string): Promise<MayanSwapStatus> {
    try {
      const response = await this.explorerApiClient.get(
        `/v3/swap/trx/${txHash}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError("trackSwap", error);
    }
  }

  /**
   * Get swap status by transaction ID
   */
  async getSwapStatus(txHash: string): Promise<string> {
    try {
      const swap = await this.trackSwap(txHash);
      return swap.status;
    } catch (error) {
      throw this.handleError("getSwapStatus", error);
    }
  }

  /**
   * Check if swap is completed
   */
  async isSwapCompleted(txHash: string): Promise<boolean> {
    try {
      const swap = await this.trackSwap(txHash);
      return (
        swap.status.includes("SETTLED") || swap.status.includes("COMPLETED")
      );
    } catch (error) {
      throw this.handleError("isSwapCompleted", error);
    }
  }

  /**
   * Poll swap status until completed or timeout
   * @param txHash Transaction hash
   * @param timeoutMs Timeout in milliseconds (default: 5 minutes)
   * @param intervalMs Polling interval (default: 5 seconds)
   */
  async pollSwapStatus(
    txHash: string,
    timeoutMs = 300000,
    intervalMs = 5000
  ): Promise<MayanSwapStatus> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const swap = await this.trackSwap(txHash);

        if (
          swap.status.includes("SETTLED") ||
          swap.status.includes("COMPLETED") ||
          swap.status.includes("FAILED")
        ) {
          return swap;
        }

        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      } catch (error) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }

    throw new Error(`Swap polling timeout after ${timeoutMs}ms`);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get current connection
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Get origin wallet
   */
  getOriginWallet(): PublicKey {
    return this.originWallet;
  }

  /**
   * Get Price API Swagger documentation URL
   */
  static getPriceApiDocsUrl(): string {
    return "https://price-api.mayan.finance/swagger";
  }

  /**
   * Get Explorer API Swagger documentation URL
   */
  static getExplorerApiDocsUrl(): string {
    return "https://explorer-api.mayan.finance/swagger";
  }

  /**
   * Validate gas drop amount for target chain
   */
  static validateGasDrop(chain: string, amount: number): boolean {
    const limit =
      this.GAS_DROP_LIMITS[chain as keyof typeof this.GAS_DROP_LIMITS];
    return limit ? amount <= limit : false;
  }

  /**
   * Get maximum gas drop for a chain
   */
  static getMaxGasDrop(chain: string): number | null {
    return (
      this.GAS_DROP_LIMITS[chain as keyof typeof this.GAS_DROP_LIMITS] || null
    );
  }

  // ============================================
  // ERROR HANDLING
  // ============================================

  private handleError(method: string, error: any): Error {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      error?.toString() ||
      "Unknown error";

    console.error(`[MayanSolanaService:${method}] Error:`, errorMessage);

    if (error?.response?.status === 404) {
      return new Error(`${method}: Resource not found`);
    }
    if (error?.response?.status === 429) {
      return new Error(`${method}: Rate limit exceeded`);
    }

    return new Error(`${method} failed: ${errorMessage}`);
  }
}

export default MayanSolanaService;
