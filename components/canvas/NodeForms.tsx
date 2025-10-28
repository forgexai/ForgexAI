"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, MessageSquare, Globe } from "lucide-react";

interface ParameterFormProps {
  parameters: Record<string, any>;
  onParameterChange: (key: string, value: any) => void;
  selectedNode?: any;
}

const cronPresets = [
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Every 12 hours", value: "0 */12 * * *" },
  { label: "Daily at midnight", value: "0 0 * * *" },
  { label: "Daily at 9:00 AM", value: "0 9 * * *" },
  { label: "Daily at 6:00 PM", value: "0 18 * * *" },
  { label: "Weekly on Monday at 9:00 AM", value: "0 9 * * 1" },
  { label: "Monthly on the 1st at 9:00 AM", value: "0 9 1 * *" },
];

export function ProtocolNodeForm({
  parameters,
  onParameterChange,
  selectedNode,
}: ParameterFormProps) {
  const nodeLabel = selectedNode?.data?.label || selectedNode?.data?.name || "";
  const nodeNameLower = nodeLabel.toLowerCase();
  
  if (nodeNameLower.includes("pyth") || nodeNameLower.includes("price feed")) {
    return <PythPriceFeedForm parameters={parameters} onParameterChange={onParameterChange} />;
  }
  
  if (nodeNameLower.includes("jupiter") || nodeNameLower.includes("swap")) {
    return <JupiterSwapForm parameters={parameters} onParameterChange={onParameterChange} />;
  }
  
  if (nodeNameLower.includes("kamino") || nodeNameLower.includes("solend") || nodeNameLower.includes("loan health")) {
    return <LoanHealthForm parameters={parameters} onParameterChange={onParameterChange} />;
  }
  
  if (nodeNameLower.includes("tensor") || nodeNameLower.includes("floor")) {
    return <TensorFloorForm parameters={parameters} onParameterChange={onParameterChange} />;
  }
  
  if (nodeNameLower.includes("marinade") || nodeNameLower.includes("jito") || nodeNameLower.includes("staking apy")) {
    return <StakingApyForm />;
  }
  
  if (nodeNameLower.includes("drift") && nodeNameLower.includes("position")) {
    return <DriftPositionForm parameters={parameters} onParameterChange={onParameterChange} />;
  }
  
  if (nodeNameLower.includes("squads")) {
    return <SquadsForm parameters={parameters} onParameterChange={onParameterChange} />;
  }
  
  return <GenericProtocolForm parameters={parameters} onParameterChange={onParameterChange} />;
}

function PythPriceFeedForm({ parameters, onParameterChange }: ParameterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="symbol" className="text-sm text-gray-300">
          Price Symbol
        </Label>
        <Input
          id="symbol"
          value={parameters.symbol || ""}
          onChange={(e) => onParameterChange("symbol", e.target.value)}
          placeholder="e.g., SOL/USD, BTC/USD"
          className="bg-[#1A1B23] border-gray-700 text-white font-mono text-xs"
        />
        <p className="text-xs text-gray-400">
          Token symbol pair (e.g., SOL/USD for Solana price in USD)
        </p>
      </div>
    </div>
  );
}

function JupiterSwapForm({ parameters, onParameterChange }: ParameterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="inputMint" className="text-sm text-gray-300">
          Input Token Address
        </Label>
        <Input
          id="inputMint"
          value={parameters.inputMint || ""}
          onChange={(e) => onParameterChange("inputMint", e.target.value)}
          placeholder="So11111111111111111111111111111111111111112"
          className="bg-[#1A1B23] border-gray-700 text-white font-mono text-xs"
        />
        <p className="text-xs text-gray-400">
          Input token mint address
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="outputMint" className="text-sm text-gray-300">
          Output Token Address
        </Label>
        <Input
          id="outputMint"
          value={parameters.outputMint || ""}
          onChange={(e) => onParameterChange("outputMint", e.target.value)}
          placeholder="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
          className="bg-[#1A1B23] border-gray-700 text-white font-mono text-xs"
        />
        <p className="text-xs text-gray-400">
          Output token mint address
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount" className="text-sm text-gray-300">
          Amount
        </Label>
        <Input
          id="amount"
          type="number"
          value={parameters.amount || ""}
          onChange={(e) => onParameterChange("amount", e.target.value)}
          placeholder="1000000000"
          className="bg-[#1A1B23] border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Amount to swap (in base units)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slippageBps" className="text-sm text-gray-300">
          Slippage (basis points)
        </Label>
        <Input
          id="slippageBps"
          type="number"
          value={parameters.slippageBps || 50}
          onChange={(e) => onParameterChange("slippageBps", e.target.value)}
          placeholder="50"
          className="bg-[#1A1B23] border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Slippage tolerance in basis points (default: 50)
        </p>
      </div>
    </div>
  );
}

function LoanHealthForm({ parameters, onParameterChange }: ParameterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="walletAddress" className="text-sm text-gray-300">
          Wallet Address
        </Label>
        <Input
          id="walletAddress"
          value={parameters.walletAddress || ""}
          onChange={(e) => onParameterChange("walletAddress", e.target.value)}
          placeholder="Your Solana wallet address"
          className="bg-[#1A1B23] border-gray-700 text-white font-mono text-xs"
        />
        <p className="text-xs text-gray-400">
          Wallet to check loan health
        </p>
      </div>
    </div>
  );
}

function TensorFloorForm({ parameters, onParameterChange }: ParameterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="collectionId" className="text-sm text-gray-300">
          Collection ID
        </Label>
        <Input
          id="collectionId"
          value={parameters.collectionId || ""}
          onChange={(e) => onParameterChange("collectionId", e.target.value)}
          placeholder="degods"
          className="bg-[#1A1B23] border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          NFT collection slug
        </p>
      </div>
    </div>
  );
}

function StakingApyForm() {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
        <p className="text-sm text-blue-300">
          This node requires no configuration. It will automatically fetch the current APY.
        </p>
      </div>
    </div>
  );
}

function DriftPositionForm({ parameters, onParameterChange }: ParameterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="walletAddress" className="text-sm text-gray-300">
          Wallet Address
        </Label>
        <Input
          id="walletAddress"
          value={parameters.walletAddress || ""}
          onChange={(e) => onParameterChange("walletAddress", e.target.value)}
          placeholder="Your Solana wallet address"
          className="bg-[#1A1B23] border-gray-700 text-white font-mono text-xs"
        />
        <p className="text-xs text-gray-400">
          Wallet to check trading positions
        </p>
      </div>
    </div>
  );
}

function SquadsForm({ parameters, onParameterChange }: ParameterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="multisigAddress" className="text-sm text-gray-300">
          Multisig Address
        </Label>
        <Input
          id="multisigAddress"
          value={parameters.multisigAddress || ""}
          onChange={(e) => onParameterChange("multisigAddress", e.target.value)}
          placeholder="Your multisig wallet address"
          className="bg-[#1A1B23] border-gray-700 text-white font-mono text-xs"
        />
        <p className="text-xs text-gray-400">
          Squads multisig wallet address
        </p>
      </div>
    </div>
  );
}

function GenericProtocolForm({ parameters, onParameterChange }: ParameterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="protocol" className="text-sm text-gray-300">
          Protocol
        </Label>
        <Input
          id="protocol"
          value={parameters.protocol || ""}
          onChange={(e) => onParameterChange("protocol", e.target.value)}
          placeholder="e.g., Jupiter, Kamino, Drift"
          className="bg-[#1A1B23] border-gray-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="walletAddress" className="text-sm text-gray-300">
          Wallet Address
        </Label>
        <Input
          id="walletAddress"
          value={parameters.walletAddress || ""}
          onChange={(e) => onParameterChange("walletAddress", e.target.value)}
          placeholder="Your Solana wallet address"
          className="bg-[#1A1B23] border-gray-700 text-white font-mono text-xs"
        />
        <p className="text-xs text-gray-400">
          Your Solana wallet address for protocol operations
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="action" className="text-sm text-gray-300">
          Action
        </Label>
        <Select
          value={parameters.action || ""}
          onValueChange={(value) => onParameterChange("action", value)}
        >
          <SelectTrigger className="bg-[#1A1B23] border-gray-700 text-white">
            <SelectValue placeholder="Select action" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1B23] border-gray-700 text-white">
            <SelectItem value="executeSwap">Execute Swap</SelectItem>
            <SelectItem value="getSwapQuote">Get Swap Quote</SelectItem>
            <SelectItem value="getTokenList">Get Token List</SelectItem>
            <SelectItem value="supply">Supply</SelectItem>
            <SelectItem value="borrow">Borrow</SelectItem>
            <SelectItem value="withdraw">Withdraw</SelectItem>
            <SelectItem value="getLoanHealth">Get Loan Health</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount" className="text-sm text-gray-300">
          Amount
        </Label>
        <Input
          id="amount"
          type="number"
          value={parameters.amount || ""}
          onChange={(e) => onParameterChange("amount", e.target.value)}
          placeholder="0.0"
          className="bg-[#1A1B23] border-gray-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tokenAddress" className="text-sm text-gray-300">
          Token Address
        </Label>
        <Input
          id="tokenAddress"
          value={parameters.tokenAddress || ""}
          onChange={(e) => onParameterChange("tokenAddress", e.target.value)}
          placeholder="Token mint address"
          className="bg-[#1A1B23] border-gray-700 text-white font-mono text-xs"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slippage" className="text-sm text-gray-300">
          Slippage (%)
        </Label>
        <Input
          id="slippage"
          type="number"
          value={parameters.slippage || "1"}
          onChange={(e) => onParameterChange("slippage", e.target.value)}
          placeholder="1"
          step="0.1"
          className="bg-[#1A1B23] border-gray-700 text-white"
        />
      </div>
    </div>
  );
}

export function CommunicationNodeForm({
  parameters,
  onParameterChange,
  selectedNode,
}: ParameterFormProps) {
  const nodeLabel = selectedNode?.data?.label || selectedNode?.data?.name || "";
  const nodeNameLower = nodeLabel.toLowerCase();
  
  if (nodeNameLower.includes("telegram")) {
    return <TelegramForm parameters={parameters} onParameterChange={onParameterChange} />;
  }
  
  if (nodeNameLower.includes("discord")) {
    return <DiscordForm parameters={parameters} onParameterChange={onParameterChange} />;
  }
  
  if (nodeNameLower.includes("web") && !nodeNameLower.includes("webhook")) {
    return <WebForm parameters={parameters} onParameterChange={onParameterChange} />;
  }
  
  if (nodeNameLower.includes("webhook")) {
    return <WebhookForm parameters={parameters} onParameterChange={onParameterChange} />;
  }
  
  return <GenericCommunicationForm parameters={parameters} onParameterChange={onParameterChange} />;
}

function TelegramForm({ parameters, onParameterChange }: ParameterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="botToken" className="text-sm text-gray-300">
          Bot Token
        </Label>
        <Input
          id="botToken"
          type="password"
          value={parameters.botToken || ""}
          onChange={(e) => onParameterChange("botToken", e.target.value)}
          placeholder="Leave empty to use default bot"
          className="bg-[#1A1B23] border-gray-700 text-white font-mono text-xs"
        />
        <p className="text-xs text-gray-400">
          Use a different bot for this node. Leave empty to use your default bot token.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="chatId" className="text-sm text-gray-300">
          Chat ID
        </Label>
        <Input
          id="chatId"
          value={parameters.chatId || ""}
          onChange={(e) => onParameterChange("chatId", e.target.value)}
          placeholder="@channelname or -1001234567890"
          className="bg-[#1A1B23] border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Telegram chat ID (optional - uses bot&apos;s default chat)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-sm text-gray-300">
          Message
        </Label>
        <Textarea
          id="message"
          value={parameters.message || ""}
          onChange={(e) => onParameterChange("message", e.target.value)}
          placeholder="Message to send"
          rows={4}
          className="bg-[#1A1B23] border-gray-700 text-white resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="parseMode" className="text-sm text-gray-300">
          Parse Mode
        </Label>
        <Select
          value={parameters.parseMode || "Markdown"}
          onValueChange={(value) => onParameterChange("parseMode", value)}
        >
          <SelectTrigger className="bg-[#1A1B23] border-gray-700 text-white">
            <SelectValue placeholder="Select parse mode" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1B23] border-gray-700 text-white">
            <SelectItem value="Markdown">Markdown</SelectItem>
            <SelectItem value="HTML">HTML</SelectItem>
            <SelectItem value="Plain">Plain Text</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function DiscordForm({ parameters, onParameterChange }: ParameterFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center p-8 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <MessageSquare className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">Discord Integration</h3>
          <p className="text-sm text-gray-400 mb-4">Discord support is coming soon!</p>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}

function WebForm({ parameters, onParameterChange }: ParameterFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center p-8 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <Globe className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">Web Integration</h3>
          <p className="text-sm text-gray-400 mb-4">Web platform support is coming soon!</p>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}

function WebhookForm({ parameters, onParameterChange }: ParameterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="statusCode" className="text-sm text-gray-300">
          Status Code
        </Label>
        <Input
          id="statusCode"
          type="number"
          value={parameters.statusCode || 200}
          onChange={(e) => onParameterChange("statusCode", e.target.value)}
          placeholder="200"
          className="bg-[#1A1B23] border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          HTTP status code (default: 200)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="body" className="text-sm text-gray-300">
          Response Body
        </Label>
        <Textarea
          id="body"
          value={parameters.body || ""}
          onChange={(e) => onParameterChange("body", e.target.value)}
          placeholder="Response body content"
          rows={4}
          className="bg-[#1A1B23] border-gray-700 text-white resize-none"
        />
      </div>
    </div>
  );
}

function GenericCommunicationForm({ parameters, onParameterChange }: ParameterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="message" className="text-sm text-gray-300">
          Message Template
        </Label>
        <Textarea
          id="message"
          value={parameters.message || ""}
          onChange={(e) => onParameterChange("message", e.target.value)}
          placeholder="Message template with {{variables}}"
          rows={4}
          className="bg-[#1A1B23] border-gray-700 text-white resize-none"
        />
      </div>
    </div>
  );
}

export function TriggerNodeForm({
  parameters,
  onParameterChange,
  selectedNode,
}: ParameterFormProps) {
  const nodeLabel = selectedNode?.data?.label || "";
  const isScheduleTimer = nodeLabel.toLowerCase().includes("schedule") || 
                          nodeLabel.toLowerCase().includes("timer") ||
                          nodeLabel.toLowerCase().includes("on schedule");
  const isMessageTrigger = nodeLabel.toLowerCase().includes("message") ||
                           nodeLabel.toLowerCase().includes("telegram");

  return (
    <div className="space-y-4">
      {isScheduleTimer && (
        <div className="space-y-2">
          <Label htmlFor="schedule-frequency" className="text-sm text-gray-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Schedule Frequency
          </Label>
          <Select
            value={parameters.cronExpression || parameters.interval || ""}
            onValueChange={(value) => onParameterChange("cronExpression", value)}
          >
            <SelectTrigger className="bg-[#1A1B23] border-gray-700 text-white">
              <SelectValue placeholder="Select when to run" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1B23] border-gray-700 text-white">
              {cronPresets.map((preset) => (
                <SelectItem
                  key={preset.value}
                  value={preset.value}
                  className="text-white hover:bg-white/10"
                >
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400">
            Choose when the workflow should run automatically
          </p>
        </div>
      )}

      {isMessageTrigger && (
        <>
          <div className="space-y-2">
            <Label htmlFor="botToken" className="text-sm text-gray-300">
              Bot Token
            </Label>
            <Input
              id="botToken"
              type="password"
              value={parameters.botToken || ""}
              onChange={(e) => onParameterChange("botToken", e.target.value)}
              placeholder="Your Telegram bot token"
              className="bg-[#1A1B23] border-gray-700 text-white font-mono text-xs"
            />
            <p className="text-xs text-gray-400">
              Get your bot token from @BotFather on Telegram
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="triggerType" className="text-sm text-gray-300">
              Trigger Type
            </Label>
            <Select
              value={parameters.triggerType || "webhook"}
              onValueChange={(value) => onParameterChange("triggerType", value)}
            >
              <SelectTrigger className="bg-[#1A1B23] border-gray-700 text-white">
                <SelectValue placeholder="Select trigger type" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1B23] border-gray-700 text-white">
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="schedule">Schedule</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {parameters.triggerType === "webhook" && (
            <div className="space-y-2">
              <Label htmlFor="webhookPath" className="text-sm text-gray-300">
                Webhook Path
              </Label>
              <Input
                id="webhookPath"
                value={parameters.webhookPath || ""}
                onChange={(e) => onParameterChange("webhookPath", e.target.value)}
                placeholder="/webhook/..."
                className="bg-[#1A1B23] border-gray-700 text-white font-mono"
              />
            </div>
          )}

          {parameters.triggerType === "event" && (
            <div className="space-y-2">
              <Label htmlFor="eventName" className="text-sm text-gray-300">
                Event Name
              </Label>
              <Input
                id="eventName"
                value={parameters.eventName || ""}
                onChange={(e) => onParameterChange("eventName", e.target.value)}
                placeholder="event.name"
                className="bg-[#1A1B23] border-gray-700 text-white"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function MemoryNodeForm({ parameters, onParameterChange }: ParameterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="operation" className="text-sm text-gray-300">
          Operation
        </Label>
        <Select
          value={parameters.operation || "store"}
          onValueChange={(value) => onParameterChange("operation", value)}
        >
          <SelectTrigger className="bg-[#1A1B23] border-gray-700 text-white">
            <SelectValue placeholder="Select operation" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1B23] border-gray-700 text-white">
            <SelectItem value="store">Store</SelectItem>
            <SelectItem value="retrieve">Retrieve</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="update">Update</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(parameters.operation === "store" ||
        parameters.operation === "update") && (
        <div className="space-y-2">
          <Label htmlFor="value" className="text-sm text-gray-300">
            Value Source
          </Label>
          <Select
            value={parameters.valueSource || "connected"}
            onValueChange={(value) => onParameterChange("valueSource", value)}
          >
            <SelectTrigger className="bg-[#1A1B23] border-gray-700 text-white">
              <SelectValue placeholder="Select value source" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1B23] border-gray-700 text-white">
              <SelectItem value="connected">
                From Connected Node (Auto)
              </SelectItem>
              <SelectItem value="manual">Manual Input</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400">
            Auto: Gets value from connected nodes. Manual: Enter custom value.
          </p>
        </div>
      )}

      {(parameters.operation === "store" ||
        parameters.operation === "update") &&
        parameters.valueSource === "manual" && (
          <div className="space-y-2">
            <Label htmlFor="value" className="text-sm text-gray-300">
              Manual Value
            </Label>
            <Textarea
              id="value"
              value={parameters.value || ""}
              onChange={(e) => onParameterChange("value", e.target.value)}
              placeholder="Enter value to store in memory"
              className="bg-[#1A1B23] border-gray-700 text-white"
              rows={3}
            />
            <p className="text-xs text-gray-400">
              This value will be stored in the workflow&apos;s memory
            </p>
          </div>
        )}

      <div className="space-y-2">
        <Label htmlFor="ttl" className="text-sm text-gray-300">
          TTL (seconds)
        </Label>
        <Input
          id="ttl"
          type="number"
          value={parameters.ttl || ""}
          onChange={(e) => onParameterChange("ttl", e.target.value)}
          placeholder="Time to live (optional)"
          className="bg-[#1A1B23] border-gray-700 text-white"
        />
      </div>
    </div>
  );
}

function UserApprovalForm({
  parameters,
  onParameterChange,
}: ParameterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="message" className="text-sm text-gray-300">
          Approval Message
        </Label>
        <Textarea
          id="message"
          value={parameters.message || ""}
          onChange={(e) => onParameterChange("message", e.target.value)}
          placeholder="Enter the message that will be shown to the user for approval"
          rows={3}
          className="bg-[#1A1B23] border-gray-700 text-white resize-none"
        />
        <p className="text-xs text-gray-400">
          The message that will be shown to the user requesting approval
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeout" className="text-sm text-gray-300">
          Timeout (seconds)
        </Label>
        <Input
          id="timeout"
          type="number"
          value={parameters.timeout || "300"}
          onChange={(e) => onParameterChange("timeout", e.target.value)}
          placeholder="300"
          className="bg-[#1A1B23] border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          How long to wait for user approval before timing out (default: 300 seconds)
        </p>
      </div>
    </div>
  );
}

export function ConditionNodeForm({
  parameters,
  onParameterChange,
  selectedNode,
}: ParameterFormProps) {
  const nodeLabel = selectedNode?.data?.label || selectedNode?.data?.name || "";
  const nodeNameLower = nodeLabel.toLowerCase();
  
  if (nodeNameLower.includes("user approval") || nodeNameLower.includes("approval")) {
    return <UserApprovalForm parameters={parameters} onParameterChange={onParameterChange} />;
  }
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="operator" className="text-sm text-gray-300">
          Comparison Operator
        </Label>
        <Select
          value={parameters.operator || "greaterThan"}
          onValueChange={(value) => onParameterChange("operator", value)}
        >
          <SelectTrigger className="bg-[#1A1B23] border-gray-700 text-white">
            <SelectValue placeholder="Select operator" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1B23] border-gray-700 text-white">
            <SelectItem value="greaterThan">&gt; (Greater Than)</SelectItem>
            <SelectItem value="lessThan">&lt; (Less Than)</SelectItem>
            <SelectItem value="equals">= (Equals)</SelectItem>
            <SelectItem value="notEquals">≠ (Not Equals)</SelectItem>
            <SelectItem value="greaterThanOrEqual">≥ (Greater Than or Equal)</SelectItem>
            <SelectItem value="lessThanOrEqual">≤ (Less Than or Equal)</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
            <SelectItem value="notContains">Not Contains</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-400">
          How to compare the values
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="leftOperand" className="text-sm text-gray-300">
          Left Operand
        </Label>
        <Input
          id="leftOperand"
          value={parameters.leftOperand || ""}
          onChange={(e) => onParameterChange("leftOperand", e.target.value)}
          placeholder="e.g., Price, HealthFactor, or connect from node"
          className="bg-[#1A1B23] border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          The value to compare. Connect from previous node or enter field name (e.g., &quot;Price&quot;, &quot;HealthFactor&quot;)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rightOperand" className="text-sm text-gray-300">
          Right Operand (Threshold)
        </Label>
        <Input
          id="rightOperand"
          value={parameters.rightOperand || ""}
          onChange={(e) => onParameterChange("rightOperand", e.target.value)}
          placeholder="e.g., 200, 1.5"
          className="bg-[#1A1B23] border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          The threshold value to compare against (e.g., &quot;200&quot; for price, &quot;1.5&quot; for health factor)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="condition" className="text-sm text-gray-300">
          Boolean Condition (Optional)
        </Label>
        <Input
          id="condition"
          value={parameters.condition || ""}
          onChange={(e) => onParameterChange("condition", e.target.value)}
          placeholder="Override with &apos;true&apos;/&apos;false&apos; (leave empty to use comparison above)"
          className="bg-[#1A1B23] border-gray-700 text-white font-mono text-xs"
        />
        <p className="text-xs text-gray-400">
          Optional: Override with manual boolean (true/false). Leave empty to use comparison above.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="trueValue" className="text-sm text-gray-300">
          True Value (Optional)
        </Label>
        <Input
          id="trueValue"
          value={parameters.trueValue || ""}
          onChange={(e) => onParameterChange("trueValue", e.target.value)}
          placeholder="Value to return when condition is true"
          className="bg-[#1A1B23] border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Optional: Value to return when condition is true
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="falseValue" className="text-sm text-gray-300">
          False Value (Optional)
        </Label>
        <Input
          id="falseValue"
          value={parameters.falseValue || ""}
          onChange={(e) => onParameterChange("falseValue", e.target.value)}
          placeholder="Value to return when condition is false"
          className="bg-[#1A1B23] border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Optional: Value to return when condition is false
        </p>
      </div>
    </div>
  );
}

export function TransformNodeForm({
  parameters,
  onParameterChange,
  selectedNode,
}: ParameterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="data" className="text-sm text-gray-300">
          Input Data
        </Label>
        <Textarea
          id="data"
          value={parameters.data || ""}
          onChange={(e) => onParameterChange("data", e.target.value)}
          placeholder="Connect data from another node or enter JSON"
          rows={4}
          className="bg-[#1A1B23] border-gray-700 text-white resize-none font-mono text-xs"
        />
        <p className="text-xs text-gray-400">
          Data to transform. Connect from another node or enter manually.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="format" className="text-sm text-gray-300">
          Output Format
        </Label>
        <Select
          value={parameters.format || "json"}
          onValueChange={(value) => onParameterChange("format", value)}
        >
          <SelectTrigger className="bg-[#1A1B23] border-gray-700 text-white">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1B23] border-gray-700 text-white">
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="string">String</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
            <SelectItem value="array">Array</SelectItem>
            <SelectItem value="object">Object</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-400">
          Desired output format for the transformed data
        </p>
      </div>
    </div>
  );
}

