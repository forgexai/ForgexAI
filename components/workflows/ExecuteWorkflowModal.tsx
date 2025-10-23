"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface WorkflowNode {
  id: string;
  name: string;
  category: string;
  inputs: Array<{
    id: string;
    name: string;
    type: string;
    required: boolean;
    default?: any;
    description?: string;
  }>;
  config: Record<string, any>;
}

interface ExecuteWorkflowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowName: string;
  nodes: WorkflowNode[];
  onExecute: (inputData: Record<string, any>) => Promise<void>;
}

export function ExecuteWorkflowModal({
  open,
  onOpenChange,
  workflowName,
  nodes,
  onExecute,
}: ExecuteWorkflowModalProps) {
  const [inputValues, setInputValues] = useState<
    Record<string, Record<string, any>>
  >({});
  const [executing, setExecuting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Extract all required inputs from nodes
  const requiredInputs = nodes.flatMap((node) =>
    node.inputs
      .filter((input) => input.required && !node.config[input.id])
      .map((input) => ({
        nodeId: node.id,
        nodeName: node.name,
        inputId: input.id,
        inputName: input.name,
        inputType: input.type,
        description: input.description,
        default: input.default,
      }))
  );

  useEffect(() => {
    // Initialize input values
    const initial: Record<string, Record<string, any>> = {};
    requiredInputs.forEach((input) => {
      if (!initial[input.nodeId]) {
        initial[input.nodeId] = {};
      }
      initial[input.nodeId][input.inputId] = input.default || "";
    });
    setInputValues(initial);
  }, [nodes]);

  const handleInputChange = (nodeId: string, inputId: string, value: any) => {
    setInputValues((prev) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        [inputId]: value,
      },
    }));

    // Clear validation error for this field
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`${nodeId}.${inputId}`];
      return newErrors;
    });
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    requiredInputs.forEach((input) => {
      const value = inputValues[input.nodeId]?.[input.inputId];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        errors[
          `${input.nodeId}.${input.inputId}`
        ] = `${input.inputName} is required`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleExecute = async () => {
    if (!validate()) {
      return;
    }

    setExecuting(true);
    try {
      // Merge inputValues with existing node configs
      const inputData: Record<string, any> = {};
      nodes.forEach((node) => {
        inputData[node.id] = {
          ...node.config,
          ...(inputValues[node.id] || {}),
        };
      });

      await onExecute(inputData);
      onOpenChange(false);
    } catch (error) {
      console.error("Execution error:", error);
    } finally {
      setExecuting(false);
    }
  };
  useEffect(() => {
    if (open && requiredInputs.length === 0) {
      const inputData: Record<string, any> = {};
      nodes.forEach((node) => {
        inputData[node.id] = { ...node.config };
      });
      onExecute(inputData);
      onOpenChange(false);
    }
  }, [open, requiredInputs, nodes, onExecute, onOpenChange]);

  if (requiredInputs.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#1A1B23] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Execute Workflow</DialogTitle>
          <DialogDescription className="text-gray-400">
            Provide required inputs for &quot;{workflowName}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[400px] overflow-y-auto py-4">
          {requiredInputs.map((input) => (
            <div key={`${input.nodeId}.${input.inputId}`} className="space-y-2">
              <Label
                htmlFor={`${input.nodeId}.${input.inputId}`}
                className="text-white"
              >
                {input.inputName}
                <span className="text-red-400 ml-1">*</span>
              </Label>
              <p className="text-xs text-gray-400">
                Node: {input.nodeName}
                {input.description && ` - ${input.description}`}
              </p>

              {input.inputType === "boolean" ? (
                <select
                  id={`${input.nodeId}.${input.inputId}`}
                  value={inputValues[input.nodeId]?.[input.inputId] || "false"}
                  onChange={(e) =>
                    handleInputChange(
                      input.nodeId,
                      input.inputId,
                      e.target.value === "true"
                    )
                  }
                  className="w-full px-3 py-2 bg-[#0A0B0F] border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              ) : input.inputType === "number" ? (
                <Input
                  id={`${input.nodeId}.${input.inputId}`}
                  type="number"
                  value={inputValues[input.nodeId]?.[input.inputId] || ""}
                  onChange={(e) =>
                    handleInputChange(
                      input.nodeId,
                      input.inputId,
                      parseFloat(e.target.value)
                    )
                  }
                  placeholder={`Enter ${input.inputName.toLowerCase()}`}
                  className="bg-[#0A0B0F] border-white/10 text-white focus:border-orange-500"
                />
              ) : (
                <Input
                  id={`${input.nodeId}.${input.inputId}`}
                  type="text"
                  value={inputValues[input.nodeId]?.[input.inputId] || ""}
                  onChange={(e) =>
                    handleInputChange(
                      input.nodeId,
                      input.inputId,
                      e.target.value
                    )
                  }
                  placeholder={`Enter ${input.inputName.toLowerCase()}`}
                  className="bg-[#0A0B0F] border-white/10 text-white focus:border-orange-500"
                />
              )}

              {validationErrors[`${input.nodeId}.${input.inputId}`] && (
                <p className="text-xs text-red-400">
                  {validationErrors[`${input.nodeId}.${input.inputId}`]}
                </p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={executing}
            className="border-gray-700 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExecute}
            disabled={executing}
            className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-600 hover:to-orange-700"
          >
            {executing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              "Execute Workflow"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
