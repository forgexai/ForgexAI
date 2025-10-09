"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function WorkflowsPage() {
  const router = useRouter();

  const handleAddWorkflow = () => {
    router.push('/canvas');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0B0C10] text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Workflows</h1>
            <Button 
              onClick={handleAddWorkflow}
              className="bg-gradient-to-r from-[#ff6b35] to-[#f7931e] hover:opacity-90"
            >
              Add Workflow
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Placeholder for workflow cards */}
            <div className="bg-[#1A1B23] border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
              <p className="text-gray-400 mb-4">Create your first workflow to get started</p>
              <Button 
                variant="outline" 
                onClick={handleAddWorkflow}
                className="w-full"
              >
                Create Workflow
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
