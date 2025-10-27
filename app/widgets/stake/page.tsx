"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Coins, Loader2, ExternalLink, TrendingUp, Info } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

interface StakingOption {
  protocol: string;
  token: string;
  apy: string;
  description: string;
  minAmount: number;
}

const stakingOptions: StakingOption[] = [
  {
    protocol: "marinade",
    token: "mSOL",
    apy: "7.2%",
    description: "Liquid staking with Marinade Finance",
    minAmount: 0.01,
  },
  {
    protocol: "sanctum",
    token: "LST",
    apy: "6.8%",
    description: "Multi-LST protocol by Sanctum",
    minAmount: 0.01,
  },
  {
    protocol: "jupiter",
    token: "JupSOL",
    apy: "7.0%",
    description: "Jupiter's liquid staking token",
    minAmount: 0.01,
  },
];

export default function StakeWidget() {
  const { user, authenticated, connectWallet } = usePrivy();
  const [amount, setAmount] = useState("");
  const [selectedOption, setSelectedOption] = useState<StakingOption>(stakingOptions[0]);
  const [staking, setStaking] = useState(false);
  const [error, setError] = useState("");

  // Get initial values from URL params (from ChatGPT)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialAmount = params.get("amount");
    const initialProtocol = params.get("protocol");
    const initialLst = params.get("lst");

    if (initialAmount) setAmount(initialAmount);
    
    if (initialProtocol || initialLst) {
      const option = stakingOptions.find(
        opt => opt.protocol === initialProtocol || opt.token === initialLst
      );
      if (option) setSelectedOption(option);
    }
  }, []);

  const executeStaking = async () => {
    if (!authenticated) {
      connectWallet();
      return;
    }

    if (!amount || parseFloat(amount) < selectedOption.minAmount) {
      setError(`Minimum amount is ${selectedOption.minAmount} SOL`);
      return;
    }

    setStaking(true);
    setError("");

    try {
      const response = await fetch("/api/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          lst: selectedOption.token,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Staking successful! You will receive ${selectedOption.token} tokens.`);
        // Reset form
        setAmount("");
      } else {
        setError(data.error || "Staking failed");
      }
    } catch (error) {
      console.error("Staking failed:", error);
      setError("Staking execution failed");
    } finally {
      setStaking(false);
    }
  };

  const estimatedReceive = amount ? (parseFloat(amount) * 0.98).toFixed(6) : "0";

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Liquid Staking
            <ExternalLink className="h-4 w-4" />
          </CardTitle>
          <CardDescription>
            Stake SOL and receive liquid staking tokens while earning rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Staking Protocol Selection */}
          <div className="space-y-2">
            <Label htmlFor="protocol">Staking Protocol</Label>
            <Select
              value={selectedOption.protocol}
              onValueChange={(value) => {
                const option = stakingOptions.find(opt => opt.protocol === value);
                if (option) setSelectedOption(option);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stakingOptions.map((option) => (
                  <SelectItem key={option.protocol} value={option.protocol}>
                    <div className="flex items-center justify-between w-full">
                      <span className="capitalize">{option.protocol}</span>
                      <span className="text-green-600 ml-2">{option.apy}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="text-sm text-muted-foreground">
              {selectedOption.description}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Stake (SOL)</Label>
            <Input
              id="amount"
              type="number"
              placeholder={`Min: ${selectedOption.minAmount} SOL`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min={selectedOption.minAmount}
            />
          </div>

          {/* Staking Info */}
          <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <TrendingUp className="h-4 w-4" />
              Staking Details
            </div>
            <div className="flex justify-between">
              <span>Protocol:</span>
              <span className="capitalize">{selectedOption.protocol}</span>
            </div>
            <div className="flex justify-between">
              <span>You'll receive:</span>
              <span>{selectedOption.token}</span>
            </div>
            <div className="flex justify-between">
              <span>Current APY:</span>
              <span className="text-green-600">{selectedOption.apy}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated receive:</span>
              <span>{estimatedReceive} {selectedOption.token}</span>
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Liquid staking tokens can be traded, used in DeFi, or unstaked at any time. 
              You continue earning staking rewards while maintaining liquidity.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Button */}
          <Button
            onClick={executeStaking}
            disabled={staking || !amount || !authenticated}
            className="w-full"
          >
            {staking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Staking...
              </>
            ) : !authenticated ? (
              "Connect Wallet to Stake"
            ) : (
              <>
                <Coins className="mr-2 h-4 w-4" />
                Stake {amount || "0"} SOL
              </>
            )}
          </Button>

          {!authenticated && (
            <p className="text-sm text-muted-foreground text-center">
              Connect your wallet to start staking
            </p>
          )}

          {/* Benefits */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="font-medium">Benefits of liquid staking:</div>
            <div>• Earn staking rewards (~7% APY)</div>
            <div>• Maintain liquidity with LST tokens</div>
            <div>• Use in DeFi protocols</div>
            <div>• No lock-up period</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
