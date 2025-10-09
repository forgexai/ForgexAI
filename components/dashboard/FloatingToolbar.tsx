"use client";

import { Button } from "@/components/ui/button";
import { Undo2, Redo2, Maximize2 } from "lucide-react";
import { useReactFlow } from "reactflow";

export function FloatingToolbar() {
  const { fitView } = useReactFlow();

  const handleUndo = () => {
  };

  const handleRedo = () => {
  };

  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 800 });
  };

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
      <div className="flex items-center gap-2 bg-[#1A1B23] border border-white/10 rounded-lg p-2 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUndo}
          className="hover:bg-white/5 text-gray-300 hover:text-white"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-white/10" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRedo}
          className="hover:bg-white/5 text-gray-300 hover:text-white"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-white/10" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFitView}
          className="hover:bg-white/5 text-gray-300 hover:text-white"
          title="Fit View"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
