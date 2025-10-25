"use client";

import { Button } from "@/components/ui/button";
import { Undo2, Redo2, Maximize2 } from "lucide-react";
import { useReactFlow } from "reactflow";
import { useAtom } from "jotai";
import { nodesAtom, edgesAtom } from "@/lib/state/atoms";
import { useState, useEffect, useRef } from "react";

export function FloatingToolbar() {
  const { fitView } = useReactFlow();
  const [nodes, setNodes] = useAtom(nodesAtom);
  const [edges, setEdges] = useAtom(edgesAtom);
  const [history, setHistory] = useState<Array<{nodes: any[], edges: any[]}>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);

  // Save state to history when nodes or edges change
  useEffect(() => {
    // Skip if this change is from undo/redo
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    const newState = { 
      nodes: JSON.parse(JSON.stringify(nodes)), 
      edges: JSON.parse(JSON.stringify(edges)) 
    };
    
    // Don't save if it's the same as the last saved state
    if (history.length > 0 && historyIndex >= 0) {
      const lastState = history[historyIndex];
      if (JSON.stringify(lastState) === JSON.stringify(newState)) {
        return;
      }
    }

    console.log("Saving to history, nodes:", nodes.length, "edges:", edges.length);

    // Remove any history after current index (when branching)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  }, [nodes, edges]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = () => {
    console.log("Undo clicked, canUndo:", canUndo, "historyIndex:", historyIndex, "history length:", history.length);
    if (canUndo) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      console.log("Undoing to state with nodes:", state.nodes.length, "edges:", state.edges.length);
      isUndoRedoRef.current = true;
      setNodes(state.nodes);
      setEdges(state.edges);
      setHistoryIndex(newIndex);
    }
  };

  const handleRedo = () => {
    console.log("Redo clicked, canRedo:", canRedo, "historyIndex:", historyIndex, "history length:", history.length);
    if (canRedo) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      console.log("Redoing to state with nodes:", state.nodes.length, "edges:", state.edges.length);
      isUndoRedoRef.current = true;
      setNodes(state.nodes);
      setEdges(state.edges);
      setHistoryIndex(newIndex);
    }
  };

  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 800 });
  };

  return (
    <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 z-10">
      <div className="flex items-center gap-1 md:gap-2 bg-[#1A1B23] border border-white/10 rounded-lg p-1 md:p-2 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUndo}
          disabled={!canUndo}
          className="hover:bg-white/5 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-white/10" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRedo}
          disabled={!canRedo}
          className="hover:bg-white/5 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
