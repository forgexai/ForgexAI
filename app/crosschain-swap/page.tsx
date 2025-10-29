"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDownUp, Search, Globe, ExternalLink } from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useDisplayMode, useMaxHeight, useWidgetProps } from "../hooks";
import {
  ensureWalletConnected,
  getWalletPublicKey,
  signAndSendTransaction,
} from "@/lib/wallet-utils";
import { TokenSearch, TokenInfo } from "@/components/ui/token-search";

interface CrossChainSwapProps extends Record<string, unknown> {
  fromChain?: string;
  toChain?: string;
  inputToken?: string;
  outputToken?: string;
  initialAmount?: string;
  destinationWallet?: string;
  slippage?: string;
}

// Supported chains for cross-chain swaps
const SUPPORTED_CHAINS = [
  { id: "solana", name: "Solana", symbol: "SOL", logo: "🟣" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", logo: "🔷" },
  { id: "bsc", name: "BSC", symbol: "BNB", logo: "🟡" },
  { id: "polygon", name: "Polygon", symbol: "MATIC", logo: "🟣" },
  { id: "avalanche", name: "Avalanche", symbol: "AVAX", logo: "🔺" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ARB", logo: "🔵" },
];

interface ChainToken {
  symbol: string;
  name: string;
  mint?: string;
  address?: string;
  decimals?: number;
  verified?: boolean;
}

export default function CrossChainSwapPage() {
  const toolOutput = useWidgetProps<CrossChainSwapProps>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();

  // URL parameters as fallback
  const [urlParams, setUrlParams] = useState<CrossChainSwapProps>({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const parsedParams = {
        fromChain: params.get("fromChain") || undefined,
        toChain: params.get("toChain") || undefined,
        inputToken: params.get("inputToken") || undefined,
        outputToken: params.get("outputToken") || undefined,
        initialAmount:
          params.get("amount") || params.get("initialAmount") || undefined,
        destinationWallet: params.get("destinationWallet") || undefined,
        slippage: params.get("slippage") || undefined,
      };
      console.log("Cross-chain swap URL params:", parsedParams);
      setUrlParams(parsedParams);
      setIsInitialized(true);
    }
  }, []);

  // Merge toolOutput with URL params
  const effectiveProps = useMemo(
    () => ({ ...urlParams, ...toolOutput }),
    [urlParams, toolOutput]
  );

  // State - initialize with defaults first, then update with URL params
  const [fromChain, setFromChain] = useState("solana");
  const [toChain, setToChain] = useState("ethereum");
  const [inputToken, setInputToken] = useState<TokenInfo>({
    mint: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    decimals: 9,
  });
  const [outputToken, setOutputToken] = useState<TokenInfo>({
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    decimals: 6,
  });
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [destinationWallet, setDestinationWallet] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTokens, setAvailableTokens] = useState<{
    [key: string]: ChainToken[];
  }>({});
  const [showInputSearch, setShowInputSearch] = useState(false);
  const [showOutputSearch, setShowOutputSearch] = useState(false);

  // Format output amount to avoid scientific notation
  const formatOutputAmount = (amount: number): string => {
    if (amount === 0) return "0.0";

    // For very small numbers, use more decimal places
    if (amount < 0.001) {
      return amount.toFixed(8).replace(/\.?0+$/, "");
    }

    // For normal numbers, use appropriate decimal places
    if (amount < 1) {
      return amount.toFixed(6).replace(/\.?0+$/, "");
    }

    return amount.toFixed(4).replace(/\.?0+$/, "");
  };

  // Update state from URL parameters when they're available
  useEffect(() => {
    if (isInitialized && effectiveProps) {
      if (effectiveProps.fromChain) {
        setFromChain(effectiveProps.fromChain);
      }
      if (effectiveProps.toChain) {
        setToChain(effectiveProps.toChain);
      }
      if (effectiveProps.inputToken) {
        setInputToken(prev => ({
          ...prev,
          symbol: effectiveProps.inputToken!,
        }));
      }
      if (effectiveProps.outputToken) {
        setOutputToken(prev => ({
          ...prev,
          symbol: effectiveProps.outputToken!,
        }));
      }
      if (effectiveProps.initialAmount) {
        setAmount(effectiveProps.initialAmount);
      }
      if (effectiveProps.destinationWallet) {
        setDestinationWallet(effectiveProps.destinationWallet);
      }
    }
  }, [isInitialized, effectiveProps]);

  // Load available tokens for chains
  useEffect(() => {
    const loadChainTokens = async () => {
      try {
        const response = await fetch("/api/crosschain/tokens");
        const data = await response.json();
        if (data.success) {
          setAvailableTokens(data.tokens);
        }
      } catch (error) {
        console.error("Failed to load chain tokens:", error);
      }
    };
    loadChainTokens();
  }, []);

  // Get available tokens for selected chains
  const fromTokens = availableTokens[fromChain] || [];
  const toTokens = availableTokens[toChain] || [];

  // Fetch cross-chain quote
  const fetchQuote = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setQuote(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/crosschain/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          fromToken: inputToken.symbol,
          toToken: outputToken.symbol,
          fromChain,
          toChain,
          slippage: 0.5, // 0.5% slippage
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch quote");
      }

      setQuote(data.quote);
    } catch (err: any) {
      setError(err.message || "Failed to fetch quote");
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  }, [amount, inputToken.symbol, outputToken.symbol, fromChain, toChain]);

  // Auto-fetch quote when parameters change
  useEffect(() => {
    const timeoutId = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [fetchQuote]);

  // Handle swap execution
  const handleSwap = async () => {
    if (!quote) return;

    try {
      setIsLoading(true);

      // Ensure wallet is connected (only for Solana side)
      if (fromChain === "solana") {
        const provider = await ensureWalletConnected();
        const publicKey = getWalletPublicKey(provider);
        setWalletAddress(publicKey);
        console.log("Wallet connected:", publicKey);

        // Execute cross-chain swap via API
        const response = await fetch("/api/crosschain/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quote,
            userPublicKey: publicKey,
            destinationWallet: publicKey, // For now, use same wallet
            fromChain,
            toChain,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Swap execution failed");
        }

        // Handle transaction execution
        if (data.swapTransaction) {
          if (data.swapTransaction.requiresClientSideExecution) {
            // Use Mayan SDK via our service
            const { MayanSolanaService } = await import("@/lib/services/mayan");
            const { getSolanaConnection } = await import("@/lib/solana-config");
            const { PublicKey } = await import("@solana/web3.js");

            // Create wallet signer function
            const walletSigner = async (transaction: any) => {
              // Serialize the transaction for wallet signing
              const serialized = transaction.serialize();
              const base64Transaction =
                Buffer.from(serialized).toString("base64");

              // Sign with browser wallet
              const signature = await signAndSendTransaction(
                provider,
                base64Transaction
              );

              // Return the signed transaction (this is what Mayan expects)
              return transaction;
            };

            try {
              // Execute the cross-chain swap using Mayan SDK
              const connection = getSolanaConnection();
              if (!publicKey) {
                throw new Error("Wallet public key not available");
              }
              const userPubkey = new PublicKey(publicKey);
              const mayanService = new MayanSolanaService(
                connection,
                userPubkey
              );

              // For cross-chain swaps, use the destination wallet from UI input
              const destinationAddress = destinationWallet;

              // Validate destination address for cross-chain swaps
              if (toChain === "ethereum") {
                if (!destinationAddress) {
                  throw new Error(
                    "Ethereum wallet address is required for cross-chain swap"
                  );
                }

                // Basic validation for Ethereum address
                if (
                  !destinationAddress.startsWith("0x") ||
                  destinationAddress.length !== 42
                ) {
                  throw new Error(
                    "Invalid Ethereum address format. Must start with 0x and be 42 characters long."
                  );
                }
              } else if (toChain !== "solana" && !destinationAddress) {
                throw new Error(
                  `${toChain} wallet address is required for cross-chain swap`
                );
              }

              const swapResult = await mayanService.swap(
                data.swapTransaction.quote,
                destinationAddress,
                null, // referrer
                walletSigner
              );

              const explorerUrl = `https://solscan.io/tx/${swapResult.signature}`;

              alert(
                `Cross-chain swap initiated!\n\nTransaction: ${swapResult.signature}\n\nFrom: ${amount} ${inputToken.symbol} on ${fromChain}\nTo: ~${quote.outputAmount} ${outputToken.symbol} on ${toChain}\n\nView: ${explorerUrl}`
              );
            } catch (swapError: any) {
              console.error("Mayan swap error:", swapError);
              throw new Error(`Cross-chain swap failed: ${swapError.message}`);
            }
          } else {
            // Regular transaction signing
            const signature = await signAndSendTransaction(
              provider,
              data.swapTransaction
            );
            const explorerUrl = `https://solscan.io/tx/${signature}`;

            alert(
              `Cross-chain swap initiated!\n\nTransaction: ${signature}\n\nFrom: ${amount} ${inputToken.symbol} on ${fromChain}\nTo: ~${quote.outputAmount} ${outputToken.symbol} on ${toChain}\n\nView: ${explorerUrl}`
            );
          }
        }
      } else {
        // For non-Solana chains, show info message
        alert(
          `Cross-chain swap from ${fromChain} not yet supported in this interface.\n\nPlease use Mayan Finance directly for ${fromChain} → ${toChain} swaps.`
        );
      }
    } catch (err: any) {
      setError(err.message || "Swap failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Swap chains
  const swapChains = () => {
    const tempChain = fromChain;
    const tempToken = inputToken;
    setFromChain(toChain);
    setToChain(tempChain);
    setInputToken(outputToken);
    setOutputToken(tempToken);
  };

  return (
    <div
      className="w-full max-w-md mx-auto p-4 space-y-4"
      style={maxHeight ? { maxHeight, overflow: "auto" } : undefined}
    >
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5" />
            Cross-Chain Swap
            <Badge variant="secondary" className="text-xs">
              Powered by ForgexAI
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* From Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">From</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={fromChain} onValueChange={setFromChain}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CHAINS.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id}>
                      <span className="flex items-center gap-2">
                        <span>{chain.logo}</span>
                        {chain.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {fromChain === "solana" ? (
                <div className="relative">
                  <Button
                    variant="outline"
                    onClick={() => setShowInputSearch(!showInputSearch)}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      {inputToken.symbol}
                      {inputToken.isVerified && " ✓"}
                      {inputToken.riskLevel === 'high' && " ⚠️"}
                      {inputToken.riskLevel === 'medium' && " ⚡"}
                    </span>
                    <Search className="h-4 w-4" />
                  </Button>
                  {showInputSearch && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1">
                      <TokenSearch
                        value={inputToken.symbol}
                        onChange={(token) => {
                          setInputToken({
                            mint: token.mint,
                            symbol: token.symbol,
                            decimals: token.decimals,
                            name: token.name,
                            isVerified: token.isVerified,
                            riskLevel: token.riskLevel,
                            securityScore: token.securityScore,
                            isRugged: token.isRugged,
                          });
                          setShowInputSearch(false);
                        }}
                        placeholder="Search input token..."
                      />
                    </div>
                  )}
                </div>
              ) : (
                <Select
                  value={inputToken.symbol}
                  onValueChange={(symbol) => {
                    const token = fromTokens.find((t) => t.symbol === symbol);
                    if (token) {
                      setInputToken({
                        mint: token.mint || token.address || "",
                        symbol: token.symbol,
                        decimals: token.decimals || 18,
                        name: token.name,
                        isVerified: token.verified,
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fromTokens.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        {token.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={swapChains}
              className="rounded-full p-2"
            >
              <ArrowDownUp className="w-4 h-4" />
            </Button>
          </div>

          {/* To Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">To</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={toChain} onValueChange={setToChain}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CHAINS.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id}>
                      <span className="flex items-center gap-2">
                        <span>{chain.logo}</span>
                        {chain.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {toChain === "solana" ? (
                <div className="relative">
                  <Button
                    variant="outline"
                    onClick={() => setShowOutputSearch(!showOutputSearch)}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      {outputToken.symbol}
                      {outputToken.isVerified && " ✓"}
                    </span>
                    <Search className="h-4 w-4" />
                  </Button>
                  {showOutputSearch && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1">
                      <TokenSearch
                        value={outputToken.symbol}
                        onChange={(token) => {
                          setOutputToken(token);
                          setShowOutputSearch(false);
                        }}
                        placeholder="Search output token..."
                      />
                    </div>
                  )}
                </div>
              ) : (
                <Select
                  value={outputToken.symbol}
                  onValueChange={(symbol) => {
                    const token = toTokens.find((t) => t.symbol === symbol);
                    if (token) {
                      setOutputToken({
                        mint: token.mint || token.address || "",
                        symbol: token.symbol,
                        decimals: token.decimals || 18,
                        name: token.name,
                        isVerified: token.verified,
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {toTokens.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        {token.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="text-lg font-medium">
                {isLoading
                  ? "..."
                  : quote
                  ? formatOutputAmount(quote.outputAmount)
                  : "0.0"}
              </div>
              <div className="text-sm text-muted-foreground">
                {outputToken.symbol} on{" "}
                {SUPPORTED_CHAINS.find((c) => c.id === toChain)?.name}
              </div>
            </div>
          </div>

          {/* Quote Details */}
          {quote && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg text-sm">
              <div className="flex justify-between">
                <span>Estimated Time:</span>
                <span>{quote.estimatedTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Bridge Fee:</span>
                <span>{quote.bridgeFee}</span>
              </div>
              <div className="flex justify-between">
                <span>Network Fee:</span>
                <span>{quote.networkFee}</span>
              </div>
              <div className="flex justify-between">
                <span>Price Impact:</span>
                <span className="text-green-600">{quote.priceImpact}</span>
              </div>
            </div>
          )}

          {/* Destination Wallet Input - Only show for cross-chain swaps */}
          {toChain !== "solana" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Destination Wallet Address (
                {toChain === "ethereum" ? "Ethereum" : toChain})
              </Label>
              <Input
                type="text"
                placeholder={`Enter your ${
                  toChain === "ethereum" ? "Ethereum" : toChain
                } wallet address (0x...)`}
                value={destinationWallet}
                onChange={(e) => setDestinationWallet(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-gray-500">
                This is where you&apos;ll receive your {outputToken.symbol}{" "}
                tokens
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            disabled={
              !quote ||
              isLoading ||
              (toChain !== "solana" && !destinationWallet)
            }
            className="w-full"
            size="lg"
          >
            {isLoading
              ? "Processing..."
              : quote
              ? "Swap Cross-Chain"
              : "Enter Amount"}
          </Button>

          {/* Info */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>Cross-chain swaps are powered by ForgexAI</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
