"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { defaultApiClient } from "@/lib/api-utils";
import { refreshApiClientAuth } from "@/lib/auth-utils";
import { nodesAtom, edgesAtom } from "@/lib/state/atoms";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
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
  TrendingUp,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

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

import { UserProfile } from "@/lib/api-utils";

export default function MarketplacePage() {
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
  const { forgexAuth, login } = usePrivyAuth();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await defaultApiClient.getMarketplaceTemplates({
        limit: 20,
        sort: sortBy,
        category: category || undefined
      });
      
      if (response.success && response.data?.marketplaceWorkflows) {
        setTemplates(response.data.marketplaceWorkflows);
      } else {
        setError("Failed to fetch templates");
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [sortBy, category]);

  const convertTemplateToNodes = (template: WorkflowTemplate) => {
    return template.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        label: node.name,
        description: node.description,
        inputs: node.inputs,
        outputs: node.outputs,
        config: node.config,
        category: node.category
      }
    }));
  };

  const convertTemplateToEdges = (template: WorkflowTemplate) => {
    return template.connections.map(conn => ({
      id: conn.id,
      source: conn.sourceNodeId,
      target: conn.targetNodeId,
      sourceHandle: conn.sourceOutputId,
      targetHandle: conn.targetInputId,
      type: 'smoothstep'
    }));
  };

  const handleUseTemplate = async (template: WorkflowTemplate) => {
    if (!forgexAuth.isAuthenticated) {
      toast.info("Please log in to use templates");
      login();
      return;
    }

    try {
      const convertedNodes = convertTemplateToNodes(template);
      const convertedEdges = convertTemplateToEdges(template);
      
      setNodes(convertedNodes);
      setEdges(convertedEdges);
      router.push('/canvas');
      toast.success(`Template "${template.name}" loaded successfully!`);
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Failed to load template");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "advanced":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      governance: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      defi: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      trading: "bg-green-500/20 text-green-400 border-green-500/30",
      nft: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    };
    return colors[category] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  // Templates are already filtered and sorted by the API
  const displayTemplates = templates;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#02021A]">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Marketplace</h1>
            <p className="text-gray-400">Browse and install workflow templates</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-[#1A1B23] border-white/10">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#02021A]">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Marketplace</h1>
            <p className="text-gray-400">Browse and install workflow templates</p>
          </div>
          <Alert className="bg-red-500/10 border-red-500/20 text-red-400">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#02021A]">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Marketplace</h1>
          <p className="text-gray-400">Browse and install workflow templates</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#1A1B23] border border-white/10 rounded px-3 py-1 text-sm text-white"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="recent">Most Recent</option>
              <option value="difficulty">Difficulty</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-[#1A1B23] border border-white/10 rounded px-3 py-1 text-sm text-white"
            >
              <option value="">All Categories</option>
              <option value="governance">Governance</option>
              <option value="defi">DeFi</option>
              <option value="trading">Trading</option>
              <option value="nft">NFT</option>
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTemplates.map((template) => (
            <Card
              key={template.id}
              className="bg-[#1A1B23] border-white/10 hover:border-white/20 transition-all duration-200 hover:shadow-lg hover:shadow-white/5"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg text-white">
                      {template.name}
                    </CardTitle>
                    {template.featured && (
                      <Badge className="bg-gradient-to-r from-[#ff6b35] to-[#f7931e] text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
                
                <CardDescription className="text-gray-300 mb-4">
                  {template.description}
                </CardDescription>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getCategoryColor(template.category)}>
                    {template.category}
                  </Badge>
                  <Badge className={getDifficultyColor(template.difficulty)}>
                    {template.difficulty}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{template.usageCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>{template.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{template.estimatedTime}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    by {template.author}
                  </div>
                  <Button
                    onClick={() => handleUseTemplate(template)}
                    className="bg-gradient-to-r from-[#ff6b35] to-[#f7931e] hover:opacity-90 text-white cursor-pointer"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {displayTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Settings className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p>Try adjusting your filters or check back later for new templates.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
