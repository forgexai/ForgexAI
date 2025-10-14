"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { CanvasHeader } from "@/components/canvas/CanvasHeader";
import { CanvasArea } from "@/components/dashboard/CanvasArea";
import { NodePaletteButton } from "@/components/canvas/NodePaletteButton";
import { NodeInspectorButton } from "@/components/canvas/NodeInspectorButton";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { defaultApiClient } from "@/lib/api-utils";
import { useAtom } from "jotai";
import { nodesAtom, edgesAtom } from "@/lib/state/atoms";
import { toast } from "sonner";

export default function CanvasPage() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('workflow');
  const mode = searchParams.get('mode');
  const isEditMode = mode === 'edit';
  
  const [nodes, setNodes] = useAtom(nodesAtom);
  const [edges, setEdges] = useAtom(edgesAtom);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadWorkflow = async () => {
      if (isEditMode && workflowId) {
        setIsLoading(true);
        try {
          const response = await defaultApiClient.getWorkflow(workflowId);
          if (response.success && response.data) {
            const workflow = response.data;
            
            // Transform API nodes to React Flow format
            const transformedNodes = workflow.nodes.map(node => {
              // Map API node types to React Flow node types
              let reactFlowType = 'condition'; // default
              if (node.type === 'protocol') {
                reactFlowType = 'solana';
              } else if (node.type === 'output') {
                reactFlowType = 'telegram';
              } else if (node.type === 'input') {
                reactFlowType = 'condition';
              }
              
              return {
                id: node.id,
                type: reactFlowType,
                position: node.position,
                data: {
                  label: node.name,
                  category: node.category,
                  description: "",
                  inputs: node.inputs,
                  outputs: node.outputs,
                  config: node.config
                }
              };
            });

            // Transform API connections to React Flow format
            const transformedEdges = workflow.connections.map(connection => ({
              id: connection.id,
              source: connection.sourceNodeId,
              target: connection.targetNodeId,
              sourceHandle: connection.sourceOutputId,
              targetHandle: connection.targetInputId,
              style: { stroke: "#f97316", strokeWidth: 2 },
              animated: true
            }));

            setNodes(transformedNodes);
            setEdges(transformedEdges);
            
            toast.success('Workflow loaded successfully');
          } else {
            toast.error('Failed to load workflow');
          }
        } catch (error) {
          console.error('Error loading workflow:', error);
          toast.error('Failed to load workflow');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadWorkflow();
  }, [workflowId, isEditMode, setNodes, setEdges]);

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="flex flex-col h-screen w-full bg-[#111827] text-white">
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">Loading workflow...</div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen w-full bg-[#111827] text-white">
        <CanvasHeader workflowId={workflowId} isEditMode={isEditMode} />
        <div className="flex-1 relative" style={{ height: 'calc(100vh - 4rem)' }}>
          <CanvasArea />
          <NodePaletteButton />
          <NodeInspectorButton />
        </div>
      </div>
    </AuthGuard>
  );
}