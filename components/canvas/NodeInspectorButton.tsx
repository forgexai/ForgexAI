"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { selectedNodeAtom, nodesAtom, edgesAtom } from "@/lib/state/atoms";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface ParameterFormProps {
  parameters: Record<string, any>;
  onParameterChange: (key: string, value: any) => void;
}

function ProtocolNodeForm({
  parameters,
  onParameterChange,
}: ParameterFormProps) {
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

function MemoryNodeForm({ parameters, onParameterChange }: ParameterFormProps) {
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

function CommunicationNodeForm({
  parameters,
  onParameterChange,
}: ParameterFormProps) {
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
          placeholder="Your Telegram bot token"
          className="bg-[#1A1B23] border-gray-700 text-white font-mono text-xs"
        />
        <p className="text-xs text-gray-400">
          Get your bot token from @BotFather on Telegram
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
          Use @channelname for public channels or -1001234567890 for private
          chats
        </p>
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="parseMode" className="text-sm text-gray-300">
          Parse Mode
        </Label>
        <Select
          value={parameters.parseMode || "markdown"}
          onValueChange={(value) => onParameterChange("parseMode", value)}
        >
          <SelectTrigger className="bg-[#1A1B23] border-gray-700 text-white">
            <SelectValue placeholder="Select parse mode" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1B23] border-gray-700 text-white">
            <SelectItem value="markdown">Markdown</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
            <SelectItem value="text">Plain Text</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ConditionNodeForm({
  parameters,
  onParameterChange,
}: ParameterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="operator" className="text-sm text-gray-300">
          Operator
        </Label>
        <Select
          value={parameters.operator || "equals"}
          onValueChange={(value) => onParameterChange("operator", value)}
        >
          <SelectTrigger className="bg-[#1A1B23] border-gray-700 text-white">
            <SelectValue placeholder="Select operator" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1B23] border-gray-700 text-white">
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="notEquals">Not Equals</SelectItem>
            <SelectItem value="greaterThan">Greater Than</SelectItem>
            <SelectItem value="lessThan">Less Than</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
            <SelectItem value="startsWith">Starts With</SelectItem>
            <SelectItem value="endsWith">Ends With</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="leftOperand" className="text-sm text-gray-300">
          Left Operand
        </Label>
        <Input
          id="leftOperand"
          value={parameters.leftOperand || ""}
          onChange={(e) => onParameterChange("leftOperand", e.target.value)}
          placeholder="Variable or value"
          className="bg-[#1A1B23] border-gray-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rightOperand" className="text-sm text-gray-300">
          Right Operand
        </Label>
        <Input
          id="rightOperand"
          value={parameters.rightOperand || ""}
          onChange={(e) => onParameterChange("rightOperand", e.target.value)}
          placeholder="Variable or value"
          className="bg-[#1A1B23] border-gray-700 text-white"
        />
      </div>
    </div>
  );
}

function TriggerNodeForm({
  parameters,
  onParameterChange,
}: ParameterFormProps) {
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

      {parameters.triggerType === "schedule" && (
        <div className="space-y-2">
          <Label htmlFor="cronExpression" className="text-sm text-gray-300">
            Cron Expression
          </Label>
          <Input
            id="cronExpression"
            value={parameters.cronExpression || ""}
            onChange={(e) =>
              onParameterChange("cronExpression", e.target.value)
            }
            placeholder="*/5 * * * *"
            className="bg-[#1A1B23] border-gray-700 text-white font-mono"
          />
        </div>
      )}

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
    </div>
  );
}

function TransformNodeForm({
  parameters,
  onParameterChange,
}: ParameterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="transformType" className="text-sm text-gray-300">
          Transform Type
        </Label>
        <Select
          value={parameters.transformType || "map"}
          onValueChange={(value) => onParameterChange("transformType", value)}
        >
          <SelectTrigger className="bg-[#1A1B23] border-gray-700 text-white">
            <SelectValue placeholder="Select transform type" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1B23] border-gray-700 text-white">
            <SelectItem value="map">Map</SelectItem>
            <SelectItem value="filter">Filter</SelectItem>
            <SelectItem value="reduce">Reduce</SelectItem>
            <SelectItem value="format">Format</SelectItem>
            <SelectItem value="parse">Parse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inputField" className="text-sm text-gray-300">
          Input Field
        </Label>
        <Input
          id="inputField"
          value={parameters.inputField || ""}
          onChange={(e) => onParameterChange("inputField", e.target.value)}
          placeholder="Field to transform"
          className="bg-[#1A1B23] border-gray-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="outputField" className="text-sm text-gray-300">
          Output Field
        </Label>
        <Input
          id="outputField"
          value={parameters.outputField || ""}
          onChange={(e) => onParameterChange("outputField", e.target.value)}
          placeholder="Output field name"
          className="bg-[#1A1B23] border-gray-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expression" className="text-sm text-gray-300">
          Expression
        </Label>
        <Textarea
          id="expression"
          value={parameters.expression || ""}
          onChange={(e) => onParameterChange("expression", e.target.value)}
          placeholder="Transformation expression"
          rows={3}
          className="bg-[#1A1B23] border-gray-700 text-white resize-none font-mono text-xs"
        />
      </div>
    </div>
  );
}

export function NodeInspectorButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useAtom(selectedNodeAtom);
  const [nodes, setNodes] = useAtom(nodesAtom);
  const [edges, setEdges] = useAtom(edgesAtom);

  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [parameters, setParameters] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedNode) {
      setIsModalOpen(true);
      setLabel(selectedNode.data?.label || "");
      setDescription(selectedNode.data?.description || "");
      setParameters(selectedNode.data?.parameters || {});
    } else {
      setIsModalOpen(false);
    }
  }, [selectedNode]);

  const getNodeCategory = () => {
    return selectedNode?.data?.category || "";
  };

  const handleParameterChange = (key: string, value: any) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveChanges = () => {
    if (!selectedNode) return;

    console.log("Saving node parameters:", {
      nodeId: selectedNode.id,
      parameters,
      category: selectedNode.data?.category,
    });

    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              data: {
                ...node.data,
                label,
                description,
                parameters,
              },
            }
          : node
      )
    );

    toast.success("Node updated successfully");
    setIsModalOpen(false);
  };

  const handleDeleteNode = () => {
    if (!selectedNode) return;

    setNodes((currentNodes) =>
      currentNodes.filter((node) => node.id !== selectedNode.id)
    );

    setEdges((currentEdges) =>
      currentEdges.filter(
        (edge) =>
          edge.source !== selectedNode.id && edge.target !== selectedNode.id
      )
    );

    setSelectedNode(null);
    toast.success("Node deleted successfully");
    setIsModalOpen(false);
  };

  return (
    <>
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false);
            setSelectedNode(null);
          }
        }}
      >
        <DialogContent
          className="bg-[#1A1B23] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-hidden w-[95vw] sm:w-full"
          aria-describedby="node-inspector-description"
        >
          <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-0 sm:pr-8">
            <DialogTitle>Node Inspector</DialogTitle>
            <div id="node-inspector-description" className="sr-only">
              Inspect and edit node properties including label, description, and
              parameters
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveChanges}
                className="bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
                size="sm"
              >
                Save Changes
              </Button>

              <Button
                onClick={handleDeleteNode}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700 cursor-pointer"
                title="Delete Node"
              >
                <Trash2 className="w-4 h-4 " />
              </Button>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh]">
            {selectedNode ? (
              <div className="space-y-4">
                <Card className="bg-[#0B0C10] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Node Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-500 uppercase tracking-wide">
                        ID
                      </Label>
                      <p className="text-sm text-gray-300 mt-1 font-mono">
                        {selectedNode.id}
                      </p>
                    </div>

                    <Separator className="bg-white/10" />

                    <div>
                      <Label className="text-xs text-gray-500 uppercase tracking-wide">
                        Category
                      </Label>
                      <p className="text-sm text-gray-300 mt-1">
                        {selectedNode.data?.category || "N/A"}
                      </p>
                    </div>

                    <Separator className="bg-white/10" />

                    <div>
                      <Label className="text-xs text-gray-500 uppercase tracking-wide">
                        Position
                      </Label>
                      <div className="text-sm text-gray-300 mt-1 font-mono">
                        <p>X: {selectedNode.position.x.toFixed(2)}</p>
                        <p>Y: {selectedNode.position.y.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0B0C10] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Edit Node
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="label" className="text-sm text-gray-300">
                        Label
                      </Label>
                      <Input
                        id="label"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Enter node label"
                        className="bg-[#1A1B23] border-gray-700 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="description"
                        className="text-sm text-gray-300"
                      >
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter node description"
                        rows={3}
                        className="bg-[#1A1B23] border-gray-700 text-white resize-none"
                      />
                    </div>

                    <Separator className="bg-white/10" />

                    <div>
                      <Label className="text-sm text-gray-300 mb-3 block">
                        Parameters
                      </Label>
                      {(() => {
                        const category = getNodeCategory();
                        switch (category) {
                          case "protocol":
                            return (
                              <ProtocolNodeForm
                                parameters={parameters}
                                onParameterChange={handleParameterChange}
                              />
                            );
                          case "memory":
                            return (
                              <MemoryNodeForm
                                parameters={parameters}
                                onParameterChange={handleParameterChange}
                              />
                            );
                          case "communication":
                            return (
                              <CommunicationNodeForm
                                parameters={parameters}
                                onParameterChange={handleParameterChange}
                              />
                            );
                          case "condition":
                            return (
                              <ConditionNodeForm
                                parameters={parameters}
                                onParameterChange={handleParameterChange}
                              />
                            );
                          case "trigger":
                            return (
                              <TriggerNodeForm
                                parameters={parameters}
                                onParameterChange={handleParameterChange}
                              />
                            );
                          case "transform":
                            return (
                              <TransformNodeForm
                                parameters={parameters}
                                onParameterChange={handleParameterChange}
                              />
                            );
                          default:
                            return (
                              <div className="space-y-2">
                                <p className="text-xs text-gray-400">
                                  No custom parameters for this node type.
                                </p>
                              </div>
                            );
                        }
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-400">No node selected</p>
                  <p className="text-xs text-gray-500">
                    Select a node on the canvas to view its details
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
