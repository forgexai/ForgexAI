"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultApiClient } from "@/lib/api-utils";
import {
  Search,
  X,
  ChevronDown,
  Plus,
  Minus,
  MessageSquare,
  Clock,
  GitBranch,
  UserCheck,
  Coins,
  FileText,
  Send,
  Database,
  BarChart3,
  Settings,
  Zap,
  Activity,
  Shield,
  TrendingUp,
  Wallet,
  Bot,
  Globe,
  Lock,
  RefreshCw,
} from "lucide-react";

// Icon mapping for serialization
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  Clock,
  GitBranch,
  UserCheck,
  Coins,
  FileText,
  Send,
  Database,
  BarChart3,
  Settings,
  Zap,
  Activity,
  Shield,
  TrendingUp,
  Wallet,
  Bot,
  Globe,
  Lock,
  RefreshCw,
};
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NodeTemplate {
  id: string;
  type: string;
  category: string;
  name: string;
  description: string;
  inputs: any[];
  outputs: any[];
  config: any;
}

interface NodeType {
  id: string;
  label: string;
  icon: string;
  category: string;
  description: string;
}

interface NodeCategory {
  id: string;
  label: string;
  nodes: NodeType[];
}

const getNodeIcon = (template: NodeTemplate): string => {
  const { type, category, id } = template;

  if (type === "input") {
    if (id.includes("telegram") || id.includes("message"))
      return "MessageSquare";
    if (id.includes("schedule") || id.includes("timer")) return "Clock";
    if (id.includes("webhook")) return "Globe";
    return "Zap";
  }

  if (type === "protocol") {
    if (id.includes("jupiter") || id.includes("swap")) return "Coins";
    if (id.includes("kamino") || id.includes("solend") || id.includes("loan"))
      return "Shield";
    if (id.includes("tensor") || id.includes("nft")) return "BarChart3";
    if (
      id.includes("marinade") ||
      id.includes("jito") ||
      id.includes("staking")
    )
      return "TrendingUp";
    if (id.includes("drift") || id.includes("position")) return "Activity";
    if (id.includes("squads") || id.includes("treasury")) return "Wallet";
    if (id.includes("pyth") || id.includes("price")) return "BarChart3";
    return "Bot";
  }

  if (type === "logic") {
    if (id.includes("if") || id.includes("condition")) return "GitBranch";
    if (id.includes("approval") || id.includes("user")) return "UserCheck";
    if (id.includes("variable") || id.includes("set")) return "Settings";
    return "GitBranch";
  }

  if (type === "data") {
    if (id.includes("transform")) return "RefreshCw";
    return "Database";
  }

  if (type === "output") {
    if (id.includes("telegram") || id.includes("message")) return "Send";
    return "Settings";
  }

  if (category === "memory") {
    return "Database";
  }

  if (category === "communication") {
    return "Send";
  }

  return "Settings";
};

const categoryLabels: Record<string, string> = {
  trigger: "Triggers",
  condition: "Logic",
  transform: "Data",
  protocol: "Protocols",
  memory: "Memory",
  communication: "Output",
};

export function NodePaletteButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [nodeTemplates, setNodeTemplates] = useState<NodeTemplate[]>([]);
  const [categories, setCategories] = useState<NodeCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNodeTemplates = async () => {
      try {
        const response = await defaultApiClient.getNodeTemplates();
        if (response.success && response.data) {
          setNodeTemplates(response.data.templates);

          const categoryMap = new Map<string, NodeType[]>();

          response.data.templates.forEach((template: NodeTemplate) => {
            const nodeType: NodeType = {
              id: template.id,
              label: template.name,
              icon: getNodeIcon(template),
              category: template.category,
              description: template.description,
            };

            if (!categoryMap.has(template.category)) {
              categoryMap.set(template.category, []);
            }
            categoryMap.get(template.category)!.push(nodeType);
          });

          const categoriesArray: NodeCategory[] = Array.from(
            categoryMap.entries()
          ).map(([categoryId, nodes]) => ({
            id: categoryId,
            label: categoryLabels[categoryId] || categoryId,
            nodes,
          }));

          setCategories(categoriesArray);
        }
      } catch (error) {
        console.error("Failed to fetch node templates:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNodeTemplates();
  }, []);

  const handleCategoryToggle = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleNodeClick = (nodeType: NodeType) => {
    const dragData = {
      type: nodeType.id,
      label: nodeType.label,
      category: nodeType.category,
      iconName: nodeType.icon,
      description: nodeType.description,
    };

    (window as any).lastDroppedNodeData = dragData;

    const event = new CustomEvent("addNode", {
      detail: dragData,
    });
    window.dispatchEvent(event);
    setIsModalOpen(false);
  };

  const filteredCategories = categories
    .map((category) => ({
      ...category,
      nodes: category.nodes.filter(
        (node) =>
          node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.nodes.length > 0);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="absolute top-4 left-4 w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg z-10"
        size="icon"
      >
        <Plus className="w-12 h-12" />
      </Button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-80 bg-[#1A1B23] border-r border-white/10 h-full flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Add Nodes</h2>
                <Button
                  onClick={() => setIsModalOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search nodes"
                  className="pl-10 pr-10 bg-[#0B0C10] border-orange-500 text-white placeholder-gray-400"
                />
                {searchQuery && (
                  <Button
                    onClick={() => setSearchQuery("")}
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-400">Loading nodes...</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCategories.map((category) => (
                    <div
                      key={category.id}
                      className="border-b border-white/5 last:border-b-0"
                    >
                      <Button
                        onClick={() => handleCategoryToggle(category.id)}
                        variant="ghost"
                        className="w-full justify-between p-3 text-white hover:bg-white/5 h-auto"
                      >
                        <span className="text-sm font-medium">
                          {category.label}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            expandedCategories[category.id] ? "rotate-180" : ""
                          }`}
                        />
                      </Button>

                      {expandedCategories[category.id] && (
                        <div className="px-3 pb-3 space-y-1">
                          {category.nodes.map((node) => {
                            const IconComponent =
                              iconMap[node.icon] || Settings;
                            return (
                              <TooltipProvider key={node.id}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      onClick={() => handleNodeClick(node)}
                                      variant="ghost"
                                      className="w-full justify-start p-2 text-gray-300 hover:text-white hover:bg-white/5 h-auto"
                                    >
                                      <div className="flex items-center gap-3 w-full min-w-0">
                                        <IconComponent className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <div className="flex-1 text-left min-w-0">
                                          <div className="text-sm font-medium">
                                            {node.label}
                                          </div>
                                        </div>
                                      </div>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="right"
                                    className="max-w-xs"
                                  >
                                    <div className="text-sm">
                                      <div className="font-medium mb-1">
                                        {node.label}
                                      </div>
                                      <div className="text-gray-300">
                                        {node.description}
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredCategories.length === 0 && searchQuery && (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-400">
                        No nodes found matching &quot;{searchQuery}&quot;
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
