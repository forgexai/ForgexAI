"use client";

import { useState, useEffect } from "react";
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
import { nodesAtom, edgesAtom, workflowNameAtom } from "@/lib/state/atoms";
import { defaultApiClient } from "@/lib/api-utils";
import { toast } from "sonner";
import { Save, Download, ChevronLeft } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CanvasHeaderProps {
  workflowId?: string | null;
  isEditMode?: boolean;
  isTemplateMode?: boolean;
}

export function CanvasHeader({ workflowId, isEditMode = false, isTemplateMode = false }: CanvasHeaderProps) {
  const router = useRouter();
  const [nodes] = useAtom(nodesAtom);
  const [edges] = useAtom(edgesAtom);
  const [workflowName, setWorkflowName] = useAtom(workflowNameAtom);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const { authenticated } = usePrivyAuth();

  useEffect(() => {
    const loadWorkflowDetails = async () => {
      if (isEditMode && workflowId) {
        try {
          const response = await defaultApiClient.getWorkflow(workflowId);
          if (response.success && response.data) {
            setWorkflowName(response.data.name);
            setWorkflowDescription(response.data.description || "");
          }
        } catch (error) {
          console.error('Error loading workflow details:', error);
        }
      } else if (isTemplateMode) {
        setWorkflowName("Template Workflow");
        setWorkflowDescription("Workflow copied from marketplace");
      }
    };

    loadWorkflowDetails();
  }, [isEditMode, isTemplateMode, workflowId]);

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
      const transformedNodes = nodes.map(node => ({
        id: node.id,
        type: (node.data?.category === 'trigger' ? 'input' : 
               node.data?.category === 'protocol' ? 'protocol' : 
               node.data?.category === 'communication' ? 'output' : 
               node.data?.category === 'condition' ? 'logic' :
               node.data?.category === 'transform' ? 'data' : 'input') as "input" | "logic" | "data" | "output" | "protocol",
        category: node.data?.category || 'trigger' as "trigger" | "condition" | "transform" | "protocol" | "memory" | "communication",
        name: node.data?.label || node.type,
        description: node.data?.description || "",
        inputs: node.data?.inputs || (() => {
          switch (node.data?.category) {
            case 'communication':
              return [
                { id: "chatId", name: "Chat ID", type: "string" as const, required: false, description: "Telegram chat ID (optional - will use bot's default chat)" },
                { id: "message", name: "Message", type: "string" as const, required: true, description: "Message to send" },
                { id: "parseMode", name: "Parse Mode", type: "string" as const, required: false, default: "Markdown", description: "Message parse mode" }
              ];
            case 'protocol':
              return [
                { id: "walletAddress", name: "Wallet Address", type: "string" as const, required: true, description: "Wallet address" }
              ];
            case 'memory':
              const operation = node.data?.parameters?.operation || 'store';
              const valueSource = node.data?.parameters?.valueSource || 'connected';
              
              if (operation === 'store' || operation === 'update') {
                if (valueSource === 'manual') {
                  return [
                    { id: "value", name: "Value", type: "any" as const, required: true, description: "Value to store" }
                  ];
                } else {

                  return [];
                }
              } else {
                return []; 
              }
            case 'trigger':
              return [
                { id: "botToken", name: "Bot Token", type: "string" as const, required: true, description: "Telegram bot token for listening to messages" }
              ];
            default:
              return [];
          }
        })(),
        outputs: node.data?.outputs || (() => {
          switch (node.data?.category) {
            case 'communication':
              return [
                { id: "messageId", name: "Message ID", type: "string" as const, description: "Sent message ID" },
                { id: "success", name: "Success", type: "boolean" as const, description: "Whether message was sent" }
              ];
            case 'protocol':
              return [
                { id: "result", name: "Result", type: "object" as const, description: "Protocol result" }
              ];
            case 'memory':
              return [
                { id: "success", name: "Success", type: "boolean" as const, description: "Operation success" }
              ];
            default:
              return [];
          }
        })(),
        config: (() => {
          const config = { ...node.data?.parameters };
          // For memory nodes, use workflow ID as memory key
          if (node.data?.category === 'memory') {
            config.key = workflowId;
          }

          if (node.data?.category === 'protocol') {
            config.protocol = config.protocol || 'jupiter';
            config.method = config.method || config.action || 'executeSwap';
          }
          if (node.data?.category === 'communication') {
            config.chatId = config.chatId || '@default_chat';
          }
          return config;
        })(),
        position: node.position
      }));

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
        setWorkflowName("Untitled Workflow");
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

  const handleSaveChanges = async () => {
    if (!workflowId) {
      toast.error("No workflow ID found");
      return;
    }

    if (!workflowName.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }

    if (nodes.length === 0) {
      toast.error("Please add nodes to your workflow before saving");
      return;
    }

    setIsSaving(true);

    try {
      const transformedNodes = nodes.map(node => ({
        id: node.id,
        type: (node.data?.category === 'trigger' ? 'input' : 
               node.data?.category === 'protocol' ? 'protocol' : 
               node.data?.category === 'communication' ? 'output' : 
               node.data?.category === 'condition' ? 'logic' :
               node.data?.category === 'transform' ? 'data' : 'input') as "input" | "logic" | "data" | "output" | "protocol",
        category: node.data?.category || 'trigger' as "trigger" | "condition" | "transform" | "protocol" | "memory" | "communication",
        name: node.data?.label || node.type,
        description: node.data?.description || "",
        inputs: node.data?.inputs || (() => {
          switch (node.data?.category) {
            case 'communication':
              return [
                { id: "chatId", name: "Chat ID", type: "string" as const, required: false, description: "Telegram chat ID (optional - will use bot's default chat)" },
                { id: "message", name: "Message", type: "string" as const, required: true, description: "Message to send" },
                { id: "parseMode", name: "Parse Mode", type: "string" as const, required: false, default: "Markdown", description: "Message parse mode" }
              ];
            case 'protocol':
              return [
                { id: "walletAddress", name: "Wallet Address", type: "string" as const, required: true, description: "Wallet address" }
              ];
            case 'memory':
              // Value is only required for store/update operations
              const operation = node.data?.parameters?.operation || 'store';
              const valueSource = node.data?.parameters?.valueSource || 'connected';
              
              if (operation === 'store' || operation === 'update') {
                if (valueSource === 'manual') {
                  return [
                    { id: "value", name: "Value", type: "any" as const, required: true, description: "Value to store" }
                  ];
                } else {
                  return [];
                }
              } else {
                return []; 
              }
            case 'trigger':
              return [
                { id: "botToken", name: "Bot Token", type: "string" as const, required: true, description: "Telegram bot token for listening to messages" }
              ];
            default:
              return [];
          }
        })(),
        outputs: node.data?.outputs || (() => {
          switch (node.data?.category) {
            case 'communication':
              return [
                { id: "messageId", name: "Message ID", type: "string" as const, description: "Sent message ID" },
                { id: "success", name: "Success", type: "boolean" as const, description: "Whether message was sent" }
              ];
            case 'protocol':
              return [
                { id: "result", name: "Result", type: "object" as const, description: "Protocol result" }
              ];
            case 'memory':
              return [
                { id: "success", name: "Success", type: "boolean" as const, description: "Operation success" }
              ];
            default:
              return [];
          }
        })(),
        config: (() => {
          const config = { ...node.data?.parameters };
          if (node.data?.category === 'memory') {
            config.key = workflowId;
          }
          if (node.data?.category === 'protocol') {
            config.protocol = config.protocol || 'jupiter';
            config.method = config.method || config.action || 'executeSwap';
          }
          if (node.data?.category === 'communication') {
            config.chatId = config.chatId || '@default_chat';
          }
          return config;
        })(),
        position: node.position
      }));

      const transformedConnections = edges.map(edge => ({
        id: edge.id,
        sourceNodeId: edge.source,
        sourceOutputId: edge.sourceHandle || 'output',
        targetNodeId: edge.target,
        targetInputId: edge.targetHandle || 'input'
      }));

      const workflowData = {
        name: workflowName,
        description: workflowDescription || `A workflow updated on ${new Date().toLocaleDateString()}`,
        nodes: transformedNodes,
        connections: transformedConnections,
        config: {
          isActive: true,
          scheduleType: "manual" as const
        },
        status: "published" as const
      };

      const response = await defaultApiClient.updateWorkflow(workflowId, workflowData);

      if (response.success) {
        toast.success("Workflow updated successfully!");
        router.push('/workflows');
      } else {
        toast.error(response.error || "Failed to update workflow");
      }
    } catch (error) {
      toast.error("Failed to update workflow. Please try again.");
      console.error("Update workflow error:", error);
    } finally {
      setIsSaving(false);
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
            className="text-gray-400 hover:text-white hover:bg-white/10 px-3 py-2 cursor-pointer"
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveWorkflow}
                  className="border-gray-700 text-black cursor-pointer px-4 py-2"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadWorkflow}
                  className="border-gray-700 text-black cursor-pointer px-4 py-2"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Load</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {isEditMode ? (
            <Button
              size="sm"
              onClick={handleSaveChanges}
              disabled={!authenticated || isSaving}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white cursor-pointer hover:opacity-90"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                setWorkflowName(isTemplateMode ? "Template Workflow" : "Untitled Workflow");
                setIsCreateModalOpen(true);
              }}
              disabled={!authenticated}
              className="bg-gradient-to-r from-[#ff6b35] to-[#f7931e] text-white cursor-pointer hover:opacity-90"
            >
              {isTemplateMode ? "Save Template as Workflow" : "Create Workflow"}
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-[#1A1B23] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{isTemplateMode ? "Save Template as Workflow" : "Create Workflow"}</DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              {isTemplateMode 
                ? "Save this template as your own workflow and make it available for execution."
                : "Save your workflow to the cloud and make it available for execution."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-name" className="text-sm text-gray-300">
                Workflow Name
              </Label>
              <Input
                id="workflow-name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Enter workflow name"
                className="bg-[#0B0C10] border-gray-700 text-white"
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
              disabled={isCreating || !workflowName.trim() || nodes.length === 0}
              className="bg-gradient-to-r from-[#ff6b35] to-[#f7931e] text-white hover:opacity-90 cursor-pointer"
            >
              {isCreating ? "Creating..." : (isTemplateMode ? "Save as Workflow" : "Create Workflow")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
