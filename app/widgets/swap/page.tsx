"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Loader2, ExternalLink } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";

interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  route?: any;
}

export default function SwapWidget() {
  const { user, authenticated, connectWallet } = usePrivy();
  const [inputToken, setInputToken] = useState("SOL");
  const [outputToken, setOutputToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [protocol, setProtocol] = useState("jupiter");

  // Get initial values from URL params (from ChatGPT)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialAmount = params.get("amount");
    const initialInput = params.get("inputToken");
    const initialOutput = params.get("outputToken");
    const initialProtocol = params.get("protocol");

    if (initialAmount) setAmount(initialAmount);
    if (initialInput) setInputToken(initialInput);
    if (initialOutput) setOutputToken(initialOutput);
    if (initialProtocol) setProtocol(initialProtocol);

    // Auto-fetch quote if we have initial values
    if (initialAmount && initialInput && initialOutput) {
      fetchQuote(
        initialAmount,
        initialInput,
        initialOutput,
        initialProtocol || "jupiter"
      );
    }
  }, []);

  const fetchQuote = async (
    amt?: string,
    input?: string,
    output?: string,
    prot?: string
  ) => {
    const amountToUse = amt || amount;
    const inputToUse = input || inputToken;
    const outputToUse = output || outputToken;
    const protocolToUse = prot || protocol;

    if (!amountToUse || !inputToUse || !outputToUse) return;

    setLoading(true);
    try {
      const response = await fetch(
        "https://forgex-ai-backend.vercel.app/api/swap/quote",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputToken: inputToUse,
            outputToken: outputToUse,
            amount: parseFloat(amountToUse),
            protocol: protocolToUse,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setQuote({
          inputAmount: amountToUse,
          outputAmount: data.data.outputAmount || "0",
          priceImpact: data.data.priceImpact || 0,
          route: data.data.route,
        });
      }
    } catch (error) {
      console.error("Failed to fetch quote:", error);
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!authenticated || !user?.wallet?.address) {
      connectWallet();
      return;
    }

    if (!quote) {
      alert("Please get a quote first");
      return;
    }

    setExecuting(true);
    try {
      // Step 1: Get Jupiter swap transaction
      const swapResponse = await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPublicKey: user.wallet.address,
          quoteResponse: quote.route || {
            inputMint: inputToken === "SOL" ? "So11111111111111111111111111111111111111112" : inputToken,
            outputMint: outputToken === "USDC" ? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" : outputToken,
            inAmount: (parseFloat(amount) * 1e9).toString(),
            outAmount: (parseFloat(quote.outputAmount) * (outputToken === "USDC" ? 1e6 : 1e9)).toString(),
            swapMode: "ExactIn",
            slippageBps: 50,
          },
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: {
            priorityLevelWithMaxLamports: {
              priorityLevel: "medium",
              maxLamports: 1000000,
            },
          },
        }),
      });

      const swapData = await swapResponse.json();
      
      if (!swapData.swapTransaction) {
        throw new Error("Failed to get swap transaction");
      }

      // Step 2: Execute transaction using Privy wallet
      const connection = new Connection("https://api.mainnet-beta.solana.com");
      const transaction = VersionedTransaction.deserialize(
        Buffer.from(swapData.swapTransaction, "base64")
      );

      // Sign and send transaction through Privy
      // Note: Privy wallet interface may vary, this is a common pattern
      const signature = await (user.wallet as any).signAndSendTransaction(transaction);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);

      alert(`Swap executed successfully! Transaction: ${signature}`);
      
      // Reset form
      setAmount("");
      setQuote(null);
      
    } catch (error: any) {
      console.error("Swap execution failed:", error);
      alert(`Swap failed: ${error.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const swapTokens = () => {
    const temp = inputToken;
    setInputToken(outputToken);
    setOutputToken(temp);
    setQuote(null);
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Multi-Protocol Swap
            <ExternalLink className="h-4 w-4" />
          </CardTitle>
          <CardDescription>
            Swap tokens across Solana DeFi protocols
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Protocol Selection */}
          <div className="space-y-2">
            <Label htmlFor="protocol">Protocol</Label>
            <Select value={protocol} onValueChange={setProtocol}>
              <SelectTrigger>
                <SelectValue placeholder="Select protocol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jupiter">Jupiter</SelectItem>
                <SelectItem value="raydium">Raydium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Input Token */}
          <div className="space-y-2">
            <Label htmlFor="input-token">From</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1"
              />
              <Select value={inputToken} onValueChange={setInputToken}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOL">SOL</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="BONK">BONK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={swapTokens}
              className="rounded-full"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Output Token */}
          <div className="space-y-2">
            <Label htmlFor="output-token">To</Label>
            <div className="flex gap-2">
              <Input
                value={quote?.outputAmount || "0.0"}
                readOnly
                className="flex-1 bg-muted"
              />
              <Select value={outputToken} onValueChange={setOutputToken}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOL">SOL</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="BONK">BONK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quote Info */}
          {quote && (
            <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Price Impact:</span>
                <span
                  className={
                    quote.priceImpact > 1 ? "text-red-500" : "text-green-500"
                  }
                >
                  {quote.priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Protocol:</span>
                <span className="capitalize">{protocol}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={() => fetchQuote()}
              disabled={loading || !amount || !inputToken || !outputToken}
              className="w-full"
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Quote...
                </>
              ) : (
                "Get Quote"
              )}
            </Button>

            <Button
              onClick={executeSwap}
              disabled={executing || !quote || !authenticated}
              className="w-full"
            >
              {executing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : !authenticated ? (
                "Connect Wallet to Swap"
              ) : (
                "Execute Swap"
              )}
            </Button>
          </div>

          {!authenticated && (
            <p className="text-sm text-muted-foreground text-center">
              Connect your wallet to execute swaps
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
