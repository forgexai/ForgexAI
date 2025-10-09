import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { GitBranch } from "lucide-react";

export function ConditionNode({ data }: NodeProps) {
  return (
    <Card className="bg-white/10 border-white/20 p-3 rounded-xl min-w-[180px] transition-all duration-300 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:border-orange-500/50 shadow-lg">
      <Handle type="target" position={Position.Top} className="!bg-orange-500" />
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-orange-400" />
        <p className="text-sm font-medium text-white">{data.label}</p>
      </div>
      {data.description && (
        <p className="text-xs text-gray-400 mt-1">{data.description}</p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-orange-500" />
    </Card>
  );
}
