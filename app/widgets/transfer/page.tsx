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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Send,
  Loader2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";

interface AddressResolution {
  address: string;
  domain?: string;
  type: "address" | "sns" | "alldomains";
}

export default function TransferWidget() {
  const { user, authenticated, connectWallet } = usePrivy();
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [resolvedAddress, setResolvedAddress] =
    useState<AddressResolution | null>(null);
  const [resolving, setResolving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Get initial values from URL params (from ChatGPT)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialTo = params.get("toAddress");
    const initialAmount = params.get("amount");

    if (initialTo) {
      setToAddress(initialTo);
      resolveAddress(initialTo);
    }
    if (initialAmount) setAmount(initialAmount);
  }, []);

  const resolveAddress = async (address: string) => {
    if (!address.trim()) {
      setResolvedAddress(null);
      return;
    }

    setResolving(true);
    setError("");

    try {
      const response = await fetch(
        "https://forgex-ai-backend.vercel.app/api/solana/wallet/balance?account=" +
          encodeURIComponent(address.trim())
      );

      const data = await response.json();
      if (data.success) {
        setResolvedAddress({
          address: data.resolvedAddress,
          domain: data.domain,
          type: data.addressType,
        });
      } else {
        setError(data.error || "Failed to resolve address");
        setResolvedAddress(null);
      }
    } catch (error) {
      console.error("Address resolution failed:", error);
      setError("Address resolution failed");
      setResolvedAddress(null);
    } finally {
      setResolving(false);
    }
  };

  const executeTransfer = async () => {
    if (!authenticated || !user?.wallet?.address) {
      connectWallet();
      return;
    }

    if (!resolvedAddress || !amount) return;

    setSending(true);
    setError("");

    try {
      // Create Solana connection
      const connection = new Connection("https://api.mainnet-beta.solana.com");
      
      // Create transfer transaction
      const fromPubkey = new PublicKey(user.wallet.address);
      const toPubkey = new PublicKey(resolvedAddress.address);
      const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        })
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      // Sign and send transaction through Privy
      const signature = await (user.wallet as any).signAndSendTransaction(transaction);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);

      alert(`Transfer successful! Transaction: ${signature}`);
      
      // Reset form
      setToAddress("");
      setAmount("");
      setResolvedAddress(null);
      
    } catch (error: any) {
      console.error("Transfer failed:", error);
      setError(`Transfer failed: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleAddressChange = (value: string) => {
    setToAddress(value);
    // Debounce address resolution
    const timeoutId = setTimeout(() => {
      resolveAddress(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send SOL
            <ExternalLink className="h-4 w-4" />
          </CardTitle>
          <CardDescription>
            Send SOL to wallet addresses or domains (.sol, .superteam, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recipient Address */}
          <div className="space-y-2">
            <Label htmlFor="to-address">To Address or Domain</Label>
            <Input
              id="to-address"
              placeholder="user.sol, wallet.superteam, or wallet address"
              value={toAddress}
              onChange={(e) => handleAddressChange(e.target.value)}
            />

            {resolving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Resolving address...
              </div>
            )}

            {resolvedAddress && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">
                      {resolvedAddress.type === "address"
                        ? "Valid Address"
                        : resolvedAddress.type === "sns"
                        ? "SNS Domain (.sol)"
                        : "AllDomains TLD"}
                    </div>
                    {resolvedAddress.domain && (
                      <div className="text-sm">
                        {resolvedAddress.domain} →{" "}
                        {resolvedAddress.address.slice(0, 8)}...
                        {resolvedAddress.address.slice(-8)}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (SOL)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.001"
              min="0"
            />
          </div>

          {/* Transaction Preview */}
          {resolvedAddress && amount && (
            <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
              <div className="font-medium">Transaction Preview</div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span>{amount} SOL</span>
              </div>
              <div className="flex justify-between">
                <span>To:</span>
                <span className="text-right">
                  {resolvedAddress.domain ||
                    `${resolvedAddress.address.slice(
                      0,
                      8
                    )}...${resolvedAddress.address.slice(-8)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Network Fee:</span>
                <span>~0.000005 SOL</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={executeTransfer}
            disabled={sending || !resolvedAddress || !amount || !authenticated}
            className="w-full"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : !authenticated ? (
              "Connect Wallet to Send"
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send {amount || "0"} SOL
              </>
            )}
          </Button>

          {!authenticated && (
            <p className="text-sm text-muted-foreground text-center">
              Connect your wallet to send SOL
            </p>
          )}

          {/* Supported Domains */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="font-medium">Supported domains:</div>
            <div>• .sol (Solana Name Service)</div>
            <div>• .superteam, .solana, .bonk, .jupiter, etc. (AllDomains)</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
