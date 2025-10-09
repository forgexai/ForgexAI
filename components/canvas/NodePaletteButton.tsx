"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Settings
} from "lucide-react";

interface NodeType {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

interface NodeCategory {
  id: string;
  label: string;
  nodes: NodeType[];
}

const nodeTypes: NodeType[] = [
  { id: "on-message", label: "On Message", icon: MessageSquare, category: "Core" },
  { id: "on-schedule", label: "On Schedule", icon: Clock, category: "Core" },
  { id: "if-else", label: "If/Else", icon: GitBranch, category: "Logic" },
  { id: "user-approval", label: "User Approval", icon: UserCheck, category: "Logic" },
  { id: "get-swap-quote", label: "Get Swap Quote", icon: Coins, category: "Solana" },
  { id: "build-transaction", label: "Build Transaction", icon: FileText, category: "Solana" },
  { id: "database-query", label: "Database Query", icon: Database, category: "Data" },
  { id: "data-analysis", label: "Data Analysis", icon: BarChart3, category: "Data" },
  { id: "send-telegram", label: "Send Telegram Message", icon: Send, category: "Output" },
  { id: "system-log", label: "System Log", icon: Settings, category: "Output" },
];

const categories: NodeCategory[] = [
  { id: "core", label: "Core", nodes: nodeTypes.filter(node => node.category === "Core") },
  { id: "logic", label: "Logic", nodes: nodeTypes.filter(node => node.category === "Logic") },
  { id: "solana", label: "Solana", nodes: nodeTypes.filter(node => node.category === "Solana") },
  { id: "data", label: "Data", nodes: nodeTypes.filter(node => node.category === "Data") },
  { id: "output", label: "Output", nodes: nodeTypes.filter(node => node.category === "Output") },
];

export function NodePaletteButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const handleCategoryToggle = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleNodeClick = (nodeType: NodeType) => {
    const event = new CustomEvent('addNode', { 
      detail: { 
        type: nodeType.id,
        label: nodeType.label,
        category: nodeType.category 
      } 
    });
    window.dispatchEvent(event);
    setIsModalOpen(false);
  };

  const filteredCategories = categories.map(category => ({
    ...category,
    nodes: category.nodes.filter(node => 
      node.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.nodes.length > 0);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="absolute top-4 left-4 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg z-10"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-80 bg-[#1A1B23] border-r border-white/10 h-full">
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
                  className="pl-10 pr-10 bg-[#0B0C10] border-blue-500 text-white placeholder-gray-400"
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
              <div className="space-y-1">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="border-b border-white/5 last:border-b-0">
                    <Button
                      onClick={() => handleCategoryToggle(category.id)}
                      variant="ghost"
                      className="w-full justify-between p-3 text-white hover:bg-white/5 h-auto"
                    >
                      <span className="text-sm font-medium">{category.label}</span>
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform ${
                          expandedCategories[category.id] ? "rotate-180" : ""
                        }`} 
                      />
                    </Button>
                    
                    {expandedCategories[category.id] && (
                      <div className="px-3 pb-3 space-y-1">
                        {category.nodes.map((node) => {
                          const IconComponent = node.icon;
                          return (
                            <Button
                              key={node.id}
                              onClick={() => handleNodeClick(node)}
                              variant="ghost"
                              className="w-full justify-start p-2 text-gray-300 hover:text-white hover:bg-white/5 h-auto"
                            >
                              <div className="flex items-center gap-3 w-full">
                                <IconComponent className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm">{node.label}</span>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
                {filteredCategories.length === 0 && searchQuery && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400">No nodes found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
