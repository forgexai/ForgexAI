"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { CanvasHeader } from "@/components/canvas/CanvasHeader";
import { CanvasArea } from "@/components/dashboard/CanvasArea";
import { NodePaletteButton } from "@/components/canvas/NodePaletteButton";
import { NodeInspectorButton } from "@/components/canvas/NodeInspectorButton";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { defaultApiClient } from "@/lib/api-utils";
import { useAtom } from "jotai";
import { nodesAtom, edgesAtom, workflowNameAtom } from "@/lib/state/atoms";
import { toast } from "sonner";

function CanvasPageContent() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("workflow");
  const mode = searchParams.get("mode");
  const isEditMode = mode === "edit";
  const isTemplateMode = mode === "template";

  const [nodes, setNodes] = useAtom(nodesAtom);
  const [edges, setEdges] = useAtom(edgesAtom);
  const [, setWorkflowName] = useAtom(workflowNameAtom);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadFromSession = () => {
      if (isEditMode || isTemplateMode) return;
      
      const savedNodes = sessionStorage.getItem('canvas_nodes');
      const savedEdges = sessionStorage.getItem('canvas_edges');
      
      if (savedNodes) {
        try {
          const parsedNodes = JSON.parse(savedNodes);
          setNodes(parsedNodes);
        } catch (e) {
          console.error('Failed to parse saved nodes:', e);
        }
      }
      
      if (savedEdges) {
        try {
          const parsedEdges = JSON.parse(savedEdges);
          setEdges(parsedEdges);
        } catch (e) {
          console.error('Failed to parse saved edges:', e);
        }
      }
    };

    loadFromSession();
  }, [isEditMode, isTemplateMode, setNodes, setEdges]);

  useEffect(() => {
    return () => {
      if (isEditMode || isTemplateMode) {
        console.log('Clearing session storage on unmount from edit/template mode');
        sessionStorage.removeItem('canvas_nodes');
        sessionStorage.removeItem('canvas_edges');
      }
    };
  }, [isEditMode, isTemplateMode]);

  useEffect(() => {
    if (!isEditMode && !isTemplateMode && !workflowId) {
      sessionStorage.removeItem('canvas_nodes');
      sessionStorage.removeItem('canvas_edges');
      setNodes([]);
      setEdges([]);
      setWorkflowName("Untitled Workflow");
      console.log('Starting fresh workflow - cleared session storage and state');
    }
  }, [isEditMode, isTemplateMode, workflowId, setNodes, setEdges, setWorkflowName]);


  useEffect(() => {
    if (isEditMode || isTemplateMode) return;
    
    sessionStorage.setItem('canvas_nodes', JSON.stringify(nodes));
    sessionStorage.setItem('canvas_edges', JSON.stringify(edges));
  }, [nodes, edges, isEditMode, isTemplateMode]);

  useEffect(() => {
    const loadWorkflow = async () => {
      if (isTemplateMode) {
        toast.success("Template loaded successfully");
        return;
      }

      if (isEditMode && workflowId) {
        setIsLoading(true);
        try {
          const response = await defaultApiClient.getWorkflow(workflowId);
          if (response.success && response.data) {
            const workflow = response.data;

            const transformedNodes = workflow.nodes.map((node: any) => {
              let reactFlowType = "condition";
              if (node.type === "protocol") {
                reactFlowType = "solana";
              } else if (node.type === "output") {
                reactFlowType = "telegram";
              } else if (node.type === "input") {
                reactFlowType = "condition";
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
                  config: node.config,
                },
              };
            });

            const transformedEdges = workflow.connections.map((connection: any) => ({
              id: connection.id,
              source: connection.sourceNodeId,
              target: connection.targetNodeId,
              sourceHandle: connection.sourceOutputId,
              targetHandle: connection.targetInputId,
              style: { stroke: "#f97316", strokeWidth: 2 },
              animated: true,
            }));

            setNodes(transformedNodes);
            setEdges(transformedEdges);

            toast.success("Workflow loaded successfully");
          } else {
            toast.error("Failed to load workflow");
          }
        } catch (error) {
          console.error("Error loading workflow:", error);
          toast.error("Failed to load workflow");
        } finally {
          setIsLoading(false);
        }
      } else if (!isEditMode && !isTemplateMode) {
        const savedNodes = sessionStorage.getItem('canvas_nodes');
        const savedEdges = sessionStorage.getItem('canvas_edges');
        
        if (!savedNodes && !savedEdges) {
          setNodes([]);
          setEdges([]);
        }
      }
    };

    loadWorkflow();
  }, [workflowId, isEditMode, isTemplateMode, setNodes, setEdges]);

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
        <CanvasHeader
          workflowId={workflowId}
          isEditMode={isEditMode}
          isTemplateMode={isTemplateMode}
        />
        <div
          className="flex-1 relative"
          style={{ height: "calc(100vh - 4rem)" }}
        >
          <CanvasArea workflowId={workflowId || undefined} />
          <NodePaletteButton />
          <NodeInspectorButton />
        </div>
      </div>
    </AuthGuard>
  );
}

export default function CanvasPage() {
  return (
    <Suspense
      fallback={
        <AuthGuard>
          <div className="flex flex-col h-screen w-full bg-[#111827] text-white">
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400">Loading canvas...</div>
            </div>
          </div>
        </AuthGuard>
      }
    >
      <CanvasPageContent />
    </Suspense>
  );
}
