"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteWorkflowDialog } from "@/components/workflows/DeleteWorkflowDialog";
import { ViewExecutionsModal } from "@/components/workflows/ViewExecutionsModal";
import { ScheduleWorkflowModal } from "@/components/workflows/ScheduleWorkflowModal";
import { DeployWorkflowModal } from "@/components/workflows/DeployWorkflowModal";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { defaultApiClient } from "@/lib/api-utils";
import { refreshApiClientAuth } from "@/lib/auth-utils";
import { toast } from "sonner";
import { WorkflowIllustration } from "@/components/common";
import {
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Calendar,
  Rocket,
  MessageCircle,
} from "lucide-react";

interface Workflow {
  id: string;
  userId: string;
  name: string;
  description: string;
  nodes: any[];
  connections: any[];
  config: {
    isActive: boolean;
    scheduleType?: "manual" | "cron" | "event";
    cronExpression?: string;
    triggerEvents?: string[];
  };
  templateId?: string;
  status: "draft" | "published" | "paused" | "error";
  createdAt: string;
  updatedAt: string;
  deployments: any[];
}

interface WorkflowsSectionProps {
  searchQuery?: string;
}

export function WorkflowsSection({ searchQuery = "" }: WorkflowsSectionProps) {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(true);
  const [workflowsError, setWorkflowsError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [executingWorkflow, setExecutingWorkflow] = useState<string | null>(
    null
  );
  const [executionsModalOpen, setExecutionsModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [workflowToSchedule, setWorkflowToSchedule] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [workflowToDeploy, setWorkflowToDeploy] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const { forgexAuth } = usePrivyAuth();

  const handleAddWorkflow = () => {
    router.push("/canvas");
  };

  const fetchWorkflows = async () => {
    try {
      setWorkflowsLoading(true);
      setWorkflowsError(null);

      refreshApiClientAuth();
      const response = await defaultApiClient.getWorkflows({
        limit: 20,
        offset: 0,
      });

      if (response.success && response.data) {
        setWorkflows(response.data.workflows);
      } else {
        setWorkflowsError(response.error || "Failed to fetch workflows");
      }
    } catch (error) {
      console.error("Error fetching workflows:", error);
      setWorkflowsError("Failed to fetch workflows");
    } finally {
      setWorkflowsLoading(false);
    }
  };

  const handleEditWorkflow = (workflowId: string) => {
    router.push(`/canvas?workflow=${workflowId}&mode=edit`);
  };

  const handleDeleteWorkflow = (workflowId: string, workflowName: string) => {
    setWorkflowToDelete({ id: workflowId, name: workflowName });
    setDeleteDialogOpen(true);
  };

  const handleViewExecutions = (workflowId: string, workflowName: string) => {
    setSelectedWorkflow({ id: workflowId, name: workflowName });
    setExecutionsModalOpen(true);
  };

  const handleScheduleWorkflow = (workflowId: string, workflowName: string) => {
    setWorkflowToSchedule({ id: workflowId, name: workflowName });
    setScheduleModalOpen(true);
  };

  const handleDeployWorkflow = (workflowId: string, workflowName: string) => {
    setWorkflowToDeploy({ id: workflowId, name: workflowName });
    setDeployModalOpen(true);
  };

  const handleChatWorkflow = (workflowId: string) => {
    router.push(`/chat?workflow=${workflowId}`);
  };

  const confirmDeleteWorkflow = async () => {
    if (!workflowToDelete) return;

    if (!forgexAuth.isAuthenticated) {
      toast.error("Please log in to delete workflows");
      return;
    }

    setIsDeleting(true);
    try {
      refreshApiClientAuth();
      const response = await defaultApiClient.deleteWorkflow(
        workflowToDelete.id
      );
      if (response.success) {
        toast.success("Workflow deleted successfully");
        const refreshResponse = await defaultApiClient.getWorkflows({
          limit: 20,
          offset: 0,
        });
        if (refreshResponse.success && refreshResponse.data) {
          setWorkflows(refreshResponse.data.workflows);
        }
      } else {
        toast.error(response.error || "Failed to delete workflow");
      }
    } catch (error) {
      console.error("Error deleting workflow:", error);
      toast.error("Failed to delete workflow");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  if (workflowsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading workflows...</div>
      </div>
    );
  }

  if (workflowsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Error: {workflowsError}</div>
      </div>
    );
  }

  const filteredWorkflows = workflows.filter((workflow) => {
    const query = searchQuery.toLowerCase();
    return (
      workflow.name.toLowerCase().includes(query) ||
      workflow.description?.toLowerCase().includes(query) ||
      workflow.category?.toLowerCase().includes(query) ||
      workflow.tags?.some((tag: string) => tag.toLowerCase().includes(query))
    );
  });

  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <div className="mb-6">
          <WorkflowIllustration size="md" />
        </div>

        <h3 className="text-xl font-semibold mb-2">No Workflows Yet</h3>
        <p className="text-center mb-6">
          Create your first autonomous Solana agent workflow
        </p>
        <Button
          onClick={handleAddWorkflow}
          className="bg-gradient-to-r from-[#ff6b35] to-[#f7931e] hover:opacity-90 cursor-pointer"
        >
          Create Your First Workflow
        </Button>
      </div>
    );
  }

  if (filteredWorkflows.length === 0 && searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
        <p className="text-center">
          No workflows match "{searchQuery}"
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkflows.map((workflow) => (
          <div
            key={workflow.id}
            className="bg-[#1A1B23] border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all duration-200 hover:shadow-lg hover:shadow-white/5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white truncate mb-1">
                  {workflow.name}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                  {workflow.description || "No description provided"}
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <span>{workflow.nodes.length} nodes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>{workflow.connections.length} connections</span>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0  text-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-[#1A1B23] border-white/10"
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScheduleWorkflow(workflow.id, workflow.name);
                    }}
                    className="text-white hover:bg-white/10 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeployWorkflow(workflow.id, workflow.name);
                    }}
                    className="text-white hover:bg-white/10 cursor-pointer"
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Deploy
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditWorkflow(workflow.id);
                    }}
                    className="text-white hover:bg-white/10 cursor-pointer"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWorkflow(workflow.id, workflow.name);
                    }}
                    className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex space-x-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewExecutions(workflow.id, workflow.name);
                  }}
                  variant="outline"
                  className="flex-1 border-gray-700 text-black hover:bg-white/80 cursor-pointer py-2 text-sm font-medium rounded-lg transition-all duration-200"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  View Executions
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChatWorkflow(workflow.id);
                  }}
                  className="flex-1 cursor-pointer bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-600 hover:to-orange-700 text-white py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <DeleteWorkflowDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        workflowName={workflowToDelete?.name || null}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteWorkflow}
      />

      <ViewExecutionsModal
        open={executionsModalOpen}
        onOpenChange={setExecutionsModalOpen}
        workflowId={selectedWorkflow?.id || ""}
        workflowName={selectedWorkflow?.name || ""}
      />

      <ScheduleWorkflowModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        workflowId={workflowToSchedule?.id || ""}
        workflowName={workflowToSchedule?.name || ""}
        onScheduleSuccess={() => {
          toast.success("Workflow scheduled successfully!");
        }}
      />

      <DeployWorkflowModal
        isOpen={deployModalOpen}
        onClose={() => setDeployModalOpen(false)}
        workflowId={workflowToDeploy?.id || ""}
        workflowName={workflowToDeploy?.name || ""}
      />
    </>
  );
}
