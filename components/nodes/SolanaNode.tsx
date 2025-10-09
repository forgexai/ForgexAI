import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Coins } from "lucide-react";

export function SolanaNode({ data }: NodeProps) {
  return (
    <Card className="bg-white/5 border-white/10 p-3 rounded-xl min-w-[180px] transition-all duration-300 hover:shadow-[0_0_20px_rgba(20,241,149,0.4)] hover:border-[#14F195]/50">
      <Handle type="target" position={Position.Top} className="!bg-[#9945FF]" />
      <div className="flex items-center gap-2">
        <Coins className="w-4 h-4 text-[#14F195]" />
        <p className="text-sm font-medium text-white">{data.label}</p>
      </div>
      {data.description && (
        <p className="text-xs text-gray-400 mt-1">{data.description}</p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-[#9945FF]" />
    </Card>
  );
}
