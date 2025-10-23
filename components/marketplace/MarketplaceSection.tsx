"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { defaultApiClient } from "@/lib/api-utils";
import { refreshApiClientAuth } from "@/lib/auth-utils";
import { nodesAtom, edgesAtom } from "@/lib/state/atoms";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Star,
  Eye,
  Download,
  Zap,
  Users,
  Clock,
  Tag,
  Play,
  Settings,
} from "lucide-react";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  author: string;
  usageCount: number;
  rating: number;
  featured: boolean;
  nodes: Array<{
    id: string;
    type: string;
    category: string;
    name: string;
    description: string;
    inputs: Array<{
      id: string;
      name: string;
      type: string;
      required: boolean;
      description?: string;
      default?: any;
    }>;
    outputs: Array<{
      id: string;
      name: string;
      type: string;
      description?: string;
    }>;
    config: Record<string, any>;
    position: { x: number; y: number };
  }>;
  connections: Array<{
    id: string;
    sourceNodeId: string;
    sourceOutputId: string;
    targetNodeId: string;
    targetInputId: string;
  }>;
  requiredInputs: Record<string, string>;
  isActive: boolean;
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
  updatedAt: {
    _seconds: number;
    _nanoseconds: number;
  };
}

type MarketplaceSectionProps = Record<string, never>;

export function MarketplaceSection({}: MarketplaceSectionProps) {
  const router = useRouter();
  const [nodes, setNodes] = useAtom(nodesAtom);
  const [edges, setEdges] = useAtom(edgesAtom);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    "popular" | "rating" | "recent" | "difficulty"
  >("popular");
  const [category, setCategory] = useState<string>("");

  useEffect(() => {
    loadMarketplaceListings();
  }, [sortBy, category]);

  const loadMarketplaceListings = async () => {
    try {
      setLoading(true);
      setError(null);

      refreshApiClientAuth();

      // Only add query parameters if user has made selections
      const params: any = {
        limit: 20,
        offset: 0,
      };

      if (sortBy !== "popular") {
        params.sort = sortBy;
      }

      if (category) {
        params.category = category;
      }

      const response = await defaultApiClient.getMarketplaceTemplates(params);

      const templatesData = response?.data?.marketplaceWorkflows || [];

      if (Array.isArray(templatesData)) {
        setTemplates(templatesData as WorkflowTemplate[]);
      } else {
        setError("API returned unexpected data format");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while loading templates");
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-900 text-green-200 border-green-700";
      case "intermediate":
        return "bg-yellow-900 text-yellow-200 border-yellow-700";
      case "advanced":
        return "bg-red-900 text-red-200 border-red-700";
      default:
        return "bg-gray-800 text-gray-200 border-gray-600";
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactElement> = {
      defi: (
        <svg
          className="w-6 h-6 text-blue-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
      nft: (
        <svg
          className="w-6 h-6 text-purple-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
        </svg>
      ),
      dao: (
        <svg
          className="w-6 h-6 text-green-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
      trading: (
        <svg
          className="w-6 h-6 text-yellow-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
        </svg>
      ),
      analytics: (
        <svg
          className="w-6 h-6 text-indigo-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
        </svg>
      ),
      automation: (
        <svg
          className="w-6 h-6 text-cyan-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      ),
      monitoring: (
        <svg
          className="w-6 h-6 text-red-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
        </svg>
      ),
      governance: (
        <svg
          className="w-6 h-6 text-emerald-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
      general: (
        <svg
          className="w-6 h-6 text-gray-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      ),
    };
    return icons[category] || icons.general;
  };

  const formatDate = (timestamp: {
    _seconds: number;
    _nanoseconds: number;
  }) => {
    return new Date(timestamp._seconds * 1000).toLocaleDateString();
  };

  const transformTemplateToReactFlow = (template: WorkflowTemplate) => {
    const transformedNodes = template.nodes.map((node) => {
      let reactFlowType = "condition"; // default
      if (node.category === "protocol") {
        reactFlowType = "solana";
      } else if (node.category === "communication") {
        reactFlowType = "telegram";
      } else if (node.category === "trigger") {
        reactFlowType = "condition";
      } else if (node.category === "logic") {
        reactFlowType = "condition";
      }

      // Default values for required inputs
      const INPUT_DEFAULT_VALUES: Record<string, any> = {
        cronExpression: "0 */2 * * *",
        interval: "*/5 * * * *",

        walletAddress: "Your Kamino lending wallet address",
        inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        collectionSlug: "your-collection-slug",
        multisigAddress: "Your multisig address",

        healthFactor: 1.1,
        threshold: 1.2,
        currentPrice: 100,
        targetPrice: 95,
        condition: "above",
        pendingCount: 1,
        currentFloor: 50,
        thresholdFloor: 60,
        direction: "below",
        lastKnownCount: 0,

        message: "Default message from template",
        chatId: "@default_chat",
        webhookUrl: "https://discord.com/api/webhooks/your-webhook-url",
        sessionId: "default-session-id",
      };

      const formattedInputs = (node.inputs || []).map((input) => {
        const defaultValue =
          input.default ??
          (input.required ? INPUT_DEFAULT_VALUES[input.id] : undefined);

        return {
          id: input.id,
          name: input.name,
          type: input.type,
          required: input.required || false,
          description: input.description || "",
          default: defaultValue,
        };
      });

      const formattedOutputs = (node.outputs || []).map((output) => ({
        id: output.id,
        name: output.name,
        type: output.type,
        description: output.description || "",
      }));

      let enhancedOutputs = formattedOutputs;
      if (
        node.category === "logic" &&
        !formattedOutputs.some((o) => o.id === "message")
      ) {
        enhancedOutputs = [
          ...formattedOutputs,
          {
            id: "message",
            name: "Message",
            type: "string",
            description: "Generated message output",
          },
        ];
      }

      let enhancedConfig = node.config || {};

      if (
        node.category === "trigger" &&
        node.name.toLowerCase().includes("schedule")
      ) {
        enhancedConfig = {
          ...enhancedConfig,
          cronExpression: "0 */2 * * *", // Every 2 hours
          interval: "0 */2 * * *",
        };
      } else if (
        node.category === "trigger" &&
        node.name.toLowerCase().includes("price")
      ) {
        enhancedConfig = {
          ...enhancedConfig,
          interval: "*/5 * * * *", // Every 5 minutes
        };
      } else if (
        node.category === "trigger" &&
        node.name.toLowerCase().includes("nft")
      ) {
        enhancedConfig = {
          ...enhancedConfig,
          interval: "*/30 * * * *", // Every 30 minutes
        };
      } else if (
        node.category === "trigger" &&
        node.name.toLowerCase().includes("governance")
      ) {
        enhancedConfig = {
          ...enhancedConfig,
          interval: "0 */2 * * *", // Every 2 hours
        };
      }

      // Add default values for protocol nodes
      if (
        node.category === "protocol" &&
        node.name.toLowerCase().includes("kamino")
      ) {
        enhancedConfig = {
          ...enhancedConfig,
          walletAddress: "Your Kamino lending wallet address",
          protocol: "kamino",
          method: "getHealthFactor",
        };
      } else if (
        node.category === "protocol" &&
        node.name.toLowerCase().includes("jupiter")
      ) {
        enhancedConfig = {
          ...enhancedConfig,
          inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          protocol: "jupiter",
          method: "getPrice",
        };
      } else if (
        node.category === "protocol" &&
        node.name.toLowerCase().includes("tensor")
      ) {
        enhancedConfig = {
          ...enhancedConfig,
          collectionSlug: "your-collection-slug",
          protocol: "tensor",
          method: "getFloorPrice",
        };
      }

      // Add default values for condition/logic nodes
      if (
        node.category === "logic" &&
        node.name.toLowerCase().includes("risk")
      ) {
        enhancedConfig = {
          ...enhancedConfig,
          messageTemplate:
            "Health factor is {healthFactor}, which is below the threshold of {threshold}. Liquidation risk is high!",
          generateMessage: true,
          healthFactor: 1.1,
          threshold: 1.2,
        };
      } else if (
        node.category === "logic" &&
        node.name.toLowerCase().includes("price")
      ) {
        enhancedConfig = {
          ...enhancedConfig,
          messageTemplate:
            "Price alert: {currentPrice} is {condition} target price {targetPrice}",
          generateMessage: true,
          currentPrice: 100,
          targetPrice: 95,
          condition: "above",
        };
      } else if (
        node.category === "logic" &&
        node.name.toLowerCase().includes("proposal")
      ) {
        enhancedConfig = {
          ...enhancedConfig,
          messageTemplate:
            "New governance proposal detected: {pendingCount} pending proposals",
          generateMessage: true,
          pendingCount: 1,
        };
      } else if (
        node.category === "logic" &&
        node.name.toLowerCase().includes("floor")
      ) {
        enhancedConfig = {
          ...enhancedConfig,
          messageTemplate:
            "Floor price alert: {currentFloor} is {direction} threshold {thresholdFloor}",
          generateMessage: true,
          currentFloor: 50,
          thresholdFloor: 60,
          direction: "below",
        };
      }

      // Add default values for communication nodes
      if (
        node.category === "communication" &&
        node.name.toLowerCase().includes("telegram")
      ) {
        enhancedConfig = {
          ...enhancedConfig,
          platform: "telegram",
          credits: 1,
          message: "Default message from template", // Fallback message
          chatId: "",
          parseMode: "Markdown",
        };
      } else if (
        node.category === "communication" &&
        node.name.toLowerCase().includes("discord")
      ) {
        enhancedConfig = {
          ...enhancedConfig,
          platform: "discord",
          credits: 1,
          message: "Default message from template", // Fallback message
          webhookUrl: "https://discord.com/api/webhooks/your-webhook-url",
        };
      } else if (
        node.category === "communication" &&
        node.name.toLowerCase().includes("mcp")
      ) {
        enhancedConfig = {
          ...enhancedConfig,
          platform: "mcp",
          credits: 1,
          message: "Default message from template", // Fallback message
          sessionId: "default-session-id",
          tools: [],
        };
      } else if (
        node.category === "communication" &&
        node.name.toLowerCase().includes("webhook")
      ) {
        enhancedConfig = {
          ...enhancedConfig,
          platform: "webhook",
          credits: 1,
          webhookUrl: "https://your-webhook-endpoint.com/webhook",
          payload: { message: "Default message from template" },
        };
      }

      // Create parameters object with current values for Node Inspector
      const parameters = { ...enhancedConfig };

      // Add current values from inputs to parameters so Node Inspector can display them
      formattedInputs.forEach((input) => {
        if (input.default !== undefined) {
          parameters[input.id] = input.default;
        }
      });

      return {
        id: node.id,
        type: reactFlowType,
        position: node.position,
        data: {
          label: node.name,
          category: node.category,
          description: node.description,
          inputs: formattedInputs,
          outputs: enhancedOutputs,
          config: enhancedConfig,
          // Add parameters for Node Inspector to display current values
          parameters: parameters,
        },
      };
    });

    // Transform template connections to React Flow format
    const transformedEdges = template.connections.map((connection) => ({
      id: connection.id,
      source: connection.sourceNodeId,
      target: connection.targetNodeId,
      sourceHandle: connection.sourceOutputId,
      targetHandle: connection.targetInputId,
      style: { stroke: "#f97316", strokeWidth: 2 },
      animated: true,
    }));

    return { nodes: transformedNodes, edges: transformedEdges };
  };

  const handleUseTemplate = (template: WorkflowTemplate) => {
    const { nodes: transformedNodes, edges: transformedEdges } =
      transformTemplateToReactFlow(template);

    console.log("Template being loaded:", template);
    console.log("Transformed nodes:", transformedNodes);
    console.log("Transformed edges:", transformedEdges);

    setNodes(transformedNodes);
    setEdges(transformedEdges);

    router.push("/canvas?mode=template");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Marketplace</h2>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Marketplace</h2>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadMarketplaceListings} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-950 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Marketplace</h2>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="recent">Most Recent</option>
            <option value="difficulty">Difficulty</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white"
          >
            <option value="">All Categories</option>
            <option value="defi">DeFi</option>
            <option value="nft">NFT</option>
            <option value="dao">DAO</option>
            <option value="trading">Trading</option>
            <option value="governance">Governance</option>
            <option value="analytics">Analytics</option>
            <option value="automation">Automation</option>
            <option value="monitoring">Monitoring</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      {!Array.isArray(templates) || templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <div className="mb-6">
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gray-500"
            >
              <rect
                x="10"
                y="15"
                width="60"
                height="50"
                rx="6"
                fill="currentColor"
                fillOpacity="0.1"
                stroke="currentColor"
                strokeWidth="2"
              />
              <rect
                x="20"
                y="25"
                width="15"
                height="12"
                rx="2"
                fill="currentColor"
                fillOpacity="0.2"
              />
              <rect
                x="45"
                y="25"
                width="15"
                height="12"
                rx="2"
                fill="currentColor"
                fillOpacity="0.2"
              />
              <rect
                x="20"
                y="45"
                width="15"
                height="12"
                rx="2"
                fill="currentColor"
                fillOpacity="0.2"
              />
              <rect
                x="45"
                y="45"
                width="15"
                height="12"
                rx="2"
                fill="currentColor"
                fillOpacity="0.2"
              />
              <circle
                cx="27.5"
                cy="31"
                r="2"
                fill="currentColor"
                fillOpacity="0.4"
              />
              <circle
                cx="52.5"
                cy="31"
                r="2"
                fill="currentColor"
                fillOpacity="0.4"
              />
              <circle
                cx="27.5"
                cy="51"
                r="2"
                fill="currentColor"
                fillOpacity="0.4"
              />
              <circle
                cx="52.5"
                cy="51"
                r="2"
                fill="currentColor"
                fillOpacity="0.4"
              />
            </svg>
          </div>
          <p className="text-center mb-6 text-gray-300">
            No workflow templates found in the marketplace
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(templates) &&
            templates.map((template) => (
              <Card
                key={template.id}
                className="hover:shadow-lg transition-shadow bg-gray-900 border-gray-700 h-[500px] flex flex-col"
              >
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2 text-white h-12 flex items-center">
                        {template.name}
                      </CardTitle>
                      <CardDescription className="mt-1 text-gray-400 h-5">
                        by {template.author}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {getCategoryIcon(template.category)}
                      {template.featured && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-yellow-900 text-yellow-200 border-yellow-700"
                        >
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-gray-300 mb-4 line-clamp-3 h-16 flex-shrink-0">
                    {template.description}
                  </p>

                  <div className="space-y-3 flex-1 flex flex-col">
                    <div className="flex items-center justify-between h-6">
                      <Badge
                        className={`text-xs ${getDifficultyColor(
                          template.difficulty
                        )}`}
                      >
                        {template.difficulty}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{template.estimatedTime}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 h-8">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs border-gray-600 text-gray-300"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-xs border-gray-600 text-gray-300"
                        >
                          +{template.tags.length - 3} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-400 h-6">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          <span>{template.rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          <span>{template.usageCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-400 h-6">
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        <span>{template.nodes.length} nodes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Settings className="w-4 h-4" />
                        <span>
                          {Object.keys(template.requiredInputs).length} inputs
                        </span>
                      </div>
                    </div>

                    <div className="flex-1"></div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-700 flex-shrink-0">
                      <div className="text-sm text-gray-400">
                        Created {formatDate(template.createdAt)}
                      </div>
                      <Button
                        size="sm"
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                        onClick={() => handleUseTemplate(template)}
                      >
                        <Play className="w-4 h-4" />
                        Use Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
