"use client";

import { useState } from "react";
import { ViewExecutionsModal } from "@/components/workflows/ViewExecutionsModal";

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
        {/* SVG Icon */}
        <div className="mb-6">
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-gray-500"
          >
            <rect
              x="10"
              y="20"
              width="60"
              height="40"
              rx="4"
              fill="currentColor"
              fillOpacity="0.1"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="15"
              y="30"
              width="20"
              height="3"
              rx="1.5"
              fill="currentColor"
              fillOpacity="0.3"
            />
            <rect
              x="15"
              y="38"
              width="30"
              height="3"
              rx="1.5"
              fill="currentColor"
              fillOpacity="0.3"
            />
            <rect
              x="15"
              y="46"
              width="25"
              height="3"
              rx="1.5"
              fill="currentColor"
              fillOpacity="0.3"
            />
            <circle
              cx="50"
              cy="35"
              r="8"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M46 35L48 37L54 31"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="50"
              cy="50"
              r="8"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M46 50L48 52L54 46"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
