"use client";

import { useState } from "react";
import { ViewExecutionsModal } from "@/components/workflows/ViewExecutionsModal";
import { ExecutionsIllustration } from "@/components/common";

type ExecutionsSectionProps = Record<string, never>;
export function ExecutionsSection({}: ExecutionsSectionProps) {
  const [executionsModalOpen, setExecutionsModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleViewExecutions = (workflowId: string, workflowName: string) => {
    setSelectedWorkflow({ id: workflowId, name: workflowName });
    setExecutionsModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <div className="mb-6">
          <ExecutionsIllustration size="md" />
        </div>

        <p className="text-center mb-6 text-gray-300">
          View and manage workflow execution history
        </p>
        <p className="text-sm text-gray-500 text-center max-w-md">
          Click on &quot;View Executions&quot; in any workflow card to see its
          execution history and monitor performance
        </p>
      </div>

      <ViewExecutionsModal
        open={executionsModalOpen}
        onOpenChange={setExecutionsModalOpen}
        workflowId={selectedWorkflow?.id || ""}
        workflowName={selectedWorkflow?.name || ""}
      />
    </>
  );
}
