"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
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

const nodeTypes: NodeType[] = [
  // Core
  { id: "on-message", label: "On Message", icon: MessageSquare, category: "Core" },
  { id: "on-schedule", label: "On Schedule", icon: Clock, category: "Core" },
  
  // Logic
  { id: "if-else", label: "If/Else", icon: GitBranch, category: "Logic" },
  { id: "user-approval", label: "User Approval", icon: UserCheck, category: "Logic" },
  
  // Solana
  { id: "get-swap-quote", label: "Get Swap Quote", icon: Coins, category: "Solana" },
  { id: "build-transaction", label: "Build Transaction", icon: FileText, category: "Solana" },
  
  // Data
  { id: "database-query", label: "Database Query", icon: Database, category: "Data" },
  { id: "data-analysis", label: "Data Analysis", icon: BarChart3, category: "Data" },
  
  // Output
  { id: "send-telegram", label: "Send Telegram Message", icon: Send, category: "Output" },
  { id: "system-log", label: "System Log", icon: Settings, category: "Output" },
];

const categories = ["Core", "Logic", "Solana", "Data", "Output"];

export function SidebarLeft() {
  const handleDragStart = (e: React.DragEvent, nodeType: NodeType) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/reactflow", JSON.stringify(nodeType));
  };

  return (
    <div className="w-80 bg-[#1A1B23] border-r border-white/10 flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex-shrink-0">
        <h2 className="text-lg font-semibold">Node Palette</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-4">
          {categories.map((category) => {
            const categoryNodes = nodeTypes.filter(node => node.category === category);
            
            return (
              <Card key={category} className="bg-[#0B0C10] border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    {category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {categoryNodes.map((node) => {
                      const IconComponent = node.icon;
                      return (
                        <div
                          key={node.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, node)}
                          className="cursor-grab hover:bg-white/5 rounded-lg p-3 border border-white/10 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <IconComponent className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                            <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                              {node.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
