"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { defaultApiClient } from "@/lib/api-utils";
import { refreshApiClientAuth } from "@/lib/auth-utils";
import { toast } from "sonner";
import { Clock, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";

interface Execution {
  id: string;
  workflowId: string;
  status: "success" | "error" | "running" | "pending";
  results: any[];
  duration: number;
  executionContext: Record<string, any>;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

interface ViewExecutionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  workflowName: string;
}

export function ViewExecutionsModal({
  open,
  onOpenChange,
  workflowId,
  workflowName,
}: ViewExecutionsModalProps) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExecutions = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Refresh auth token before making the request
      refreshApiClientAuth();
      
      const response = await defaultApiClient.getWorkflowExecutions(workflowId, {
        limit: 50,
        offset: 0,
      });

      if (response.success && response.data) {
        setExecutions(response.data.executions);
      } else {
        toast.error(response.error || "Failed to fetch executions");
      }
    } catch (error) {
      console.error("Error fetching executions:", error);
      toast.error("Failed to fetch executions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (open && workflowId) {
      fetchExecutions();
    }
  }, [open, workflowId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "success":
        return `${baseClasses} bg-green-600/20 text-green-400 border border-green-600/30`;
      case "error":
        return `${baseClasses} bg-red-600/20 text-red-400 border border-red-600/30`;
      case "running":
        return `${baseClasses} bg-blue-600/20 text-blue-400 border border-blue-600/30`;
      case "pending":
        return `${baseClasses} bg-yellow-600/20 text-yellow-400 border border-yellow-600/30`;
      default:
        return `${baseClasses} bg-gray-600/20 text-gray-400 border border-gray-600/30`;
    }
  };

  const formatDuration = (duration: number) => {
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1B23] border-white/10 text-white max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Workflow Executions</DialogTitle>
              <DialogDescription className="text-gray-400">
                Execution history for "{workflowName}"
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchExecutions(true)}
              disabled={refreshing}
              className="border-gray-700 text-black cursor-pointer mr-4"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Loading executions...</span>
            </div>
          ) : executions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Clock className="w-8 h-8 mb-2" />
              <p>No executions found</p>
              <p className="text-sm">This workflow hasn't been executed yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {executions.map((execution) => (
                <div
                  key={execution.id}
                  className="bg-[#0B0C10] border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(execution.status)}
                      <div>
                        <h4 className="text-sm font-medium text-white">
                          Execution #{execution.id.slice(-8)}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {formatDate(execution.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={getStatusBadge(execution.status)}>
                        {execution.status}
                      </span>
                      {execution.duration && (
                        <span className="text-xs text-gray-400">
                          {formatDuration(execution.duration)}
                        </span>
                      )}
                    </div>
                  </div>

                  {execution.error && (
                    <div className="bg-red-600/10 border border-red-600/20 rounded p-2 mb-2">
                      <p className="text-xs text-red-400 font-medium">Error:</p>
                      <p className="text-xs text-red-300">{execution.error}</p>
                    </div>
                  )}

                  {execution.results && execution.results.length > 0 && (
                    <div className="bg-green-600/10 border border-green-600/20 rounded p-2">
                      <p className="text-xs text-green-400 font-medium mb-1">Results:</p>
                      <div className="text-xs text-green-300">
                        {execution.results.length} result{execution.results.length !== 1 ? "s" : ""} generated
                      </div>
                    </div>
                  )}

                  {execution.executionContext && Object.keys(execution.executionContext).length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-400 mb-1">Context:</p>
                      <div className="text-xs text-gray-300 bg-white/5 rounded p-2">
                        {Object.entries(execution.executionContext).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-400">{key}:</span>
                            <span className="text-white">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
