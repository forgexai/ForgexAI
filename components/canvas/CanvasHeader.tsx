"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nodesAtom, edgesAtom } from "@/lib/state/atoms";
import { defaultApiClient } from "@/lib/api-utils";
import { toast } from "sonner";
import { Save, Download, Plus, ChevronLeft } from "lucide-react";

export function CanvasHeader() {
  const router = useRouter();
  const [nodes] = useAtom(nodesAtom);
  const [edges] = useAtom(edgesAtom);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [isEditingName, setIsEditingName] = useState(false);
  const { authenticated } = usePrivyAuth();

  const handleSaveWorkflow = () => {
    const workflow = {
      nodes,
      edges,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(workflow, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${workflowName}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Workflow saved successfully");
  };

  const handleLoadWorkflow = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const workflow = JSON.parse(text);

        if (workflow.nodes && workflow.edges) {
          toast.success("Workflow loaded successfully");
        } else {
          toast.error("Invalid workflow file");
        }
      } catch (error) {
        toast.error("Failed to load workflow");
      }
    };
    input.click();
  };

  const handleCreateWorkflow = async () => {
    if (!workflowName.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }

    if (nodes.length === 0) {
      toast.error("Please add nodes to your workflow before creating");
      return;
    }

    setIsCreating(true);

    try {
      // Transform nodes to match API format
      const transformedNodes = nodes.map(node => ({
        id: node.id,
        type: node.type === 'condition' ? 'input' : 
              node.type === 'solana' ? 'protocol' : 
              node.type === 'telegram' ? 'output' : 'input',
        category: node.type === 'condition' ? 'trigger' :
                  node.type === 'solana' ? 'protocol' :
                  node.type === 'telegram' ? 'communication' : 'trigger',
        name: node.data?.label || node.type,
        description: node.data?.description || `${node.type} node`,
        inputs: node.data?.inputs || [],
        outputs: node.data?.outputs || [],
        config: node.data?.config || {},
        position: node.position
      }));

      // Transform edges to match API format
      const transformedConnections = edges.map(edge => ({
        id: edge.id,
        sourceNodeId: edge.source,
        sourceOutputId: edge.sourceHandle || 'output',
        targetNodeId: edge.target,
        targetInputId: edge.targetHandle || 'input'
      }));

      const workflowData = {
        name: workflowName,
        description: workflowDescription || `A workflow created on ${new Date().toLocaleDateString()}`,
        nodes: transformedNodes,
        connections: transformedConnections,
        config: {
          isActive: true,
          scheduleType: "manual" as const
        },
        status: "published" as const
      };

      const response = await defaultApiClient.createWorkflow(workflowData);

      if (response.success) {
        toast.success("Workflow created successfully!");
        setIsCreateModalOpen(false);
        setWorkflowDescription("");
        router.push('/workflows');
      } else {
        toast.error(response.error || "Failed to create workflow");
      }
    } catch (error) {
      toast.error("Failed to create workflow. Please try again.");
      console.error("Create workflow error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleNameEdit = () => {
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    setIsEditingName(false);
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSave();
    }
  };

  const handleBackClick = () => {
    router.push('/workflows');
  };

  return (
    <>
      <div className="h-16 bg-[#1A1B23] border-b border-white/10 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="text-gray-400 hover:text-white hover:bg-white/10 px-3 py-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          {isEditingName ? (
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              onBlur={handleNameSave}
              onKeyPress={handleNameKeyPress}
              className="bg-transparent border-none text-white font-semibold text-lg px-3 py-2 h-auto focus:ring-0 focus:border-none hover:bg-white/5 rounded"
              autoFocus
            />
          ) : (
            <h1 
              className="text-lg font-semibold text-white cursor-pointer hover:bg-white/5 px-3 py-2 rounded transition-colors"
              onClick={handleNameEdit}
            >
              {workflowName}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveWorkflow}
            className="border-gray-700 text-black cursor-pointer px-4 py-2"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadWorkflow}
            className="border-gray-700 text-black cursor-pointer px-4 py-2"
          >
            <Download className="w-4 h-4 mr-2" />
            Load
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!authenticated}
            className="bg-gradient-to-r from-[#ff6b35] to-[#f7931e] text-white cursor-pointer hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-[#1A1B23] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Create Workflow</DialogTitle>
            <DialogDescription className="text-gray-400">
              Save your workflow to the cloud and make it available for execution.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workflowDescription" className="text-sm text-gray-300">
                Description (Optional)
              </Label>
              <Textarea
                id="workflowDescription"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Describe what this workflow does..."
                className="bg-[#0B0C10] border-gray-700 text-white min-h-[80px]"
              />
            </div>

            <div className="bg-[#0B0C10] border border-white/10 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-2">Workflow Summary:</p>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-300">
                  {nodes.length} node{nodes.length !== 1 ? "s" : ""}
                </span>
                <span className="text-gray-300">
                  {edges.length} connection{edges.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="border-gray-700 text-black cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkflow}
              disabled={isCreating || !workflowName.trim()}
              className="bg-gradient-to-r from-[#ff6b35] to-[#f7931e] text-white hover:opacity-90 cursor-pointer"
            >
              {isCreating ? "Creating..." : "Create Workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
