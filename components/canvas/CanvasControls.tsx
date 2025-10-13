"use client";

import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Minus, 
  Maximize2, 
  Lock, 
  Sun, 
  Star 
} from "lucide-react";
import { useRef, useEffect } from "react";

export function CanvasControls() {
  const reactFlowInstanceRef = useRef<any>(null);

  useEffect(() => {
    const handleReactFlowInit = (event: CustomEvent) => {
      reactFlowInstanceRef.current = event.detail;
    };

    window.addEventListener('reactFlowInit', handleReactFlowInit as EventListener);
    return () => {
      window.removeEventListener('reactFlowInit', handleReactFlowInit as EventListener);
    };
  }, []);

  const handleZoomIn = () => {
    if (reactFlowInstanceRef.current) {
      reactFlowInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (reactFlowInstanceRef.current) {
      reactFlowInstanceRef.current.zoomOut();
    }
  };

  const handleFitView = () => {
    if (reactFlowInstanceRef.current) {
      reactFlowInstanceRef.current.fitView();
    }
  };

  const handleLockCanvas = () => {
    // TODO: Implement lock canvas functionality
  };

  const handleToggleTheme = () => {
    // TODO: Implement theme toggle
  };

  const handleStarAction = () => {
    // TODO: Implement star action
  };

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
      <div className="bg-[#1A1B23] border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2 shadow-lg">
        <Button
          onClick={handleZoomIn}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 h-8 w-8 p-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
        
        <Button
          onClick={handleZoomOut}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 h-8 w-8 p-0"
        >
          <Minus className="w-4 h-4" />
        </Button>
        
        <Button
          onClick={handleFitView}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 h-8 w-8 p-0"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
        
        <Button
          onClick={handleLockCanvas}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 h-8 w-8 p-0"
        >
          <Lock className="w-4 h-4" />
        </Button>
        
        <Button
          onClick={handleToggleTheme}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 h-8 w-8 p-0"
        >
          <Sun className="w-4 h-4" />
        </Button>
        
        <Button
          onClick={handleStarAction}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 h-8 w-8 p-0"
        >
          <Star className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
