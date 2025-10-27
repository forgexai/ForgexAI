"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { selectedNodeAtom, nodesAtom, edgesAtom } from "@/lib/state/atoms";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { ProtocolNodeForm, CommunicationNodeForm, TriggerNodeForm, MemoryNodeForm, ConditionNodeForm, TransformNodeForm } from "./NodeForms";

const cronPresets = [
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Every 12 hours", value: "0 */12 * * *" },
  { label: "Daily at midnight", value: "0 0 * * *" },
  { label: "Daily at 9:00 AM", value: "0 9 * * *" },
  { label: "Daily at 6:00 PM", value: "0 18 * * *" },
  { label: "Weekly on Monday at 9:00 AM", value: "0 9 * * 1" },
  { label: "Monthly on the 1st at 9:00 AM", value: "0 9 1 * *" },
];

interface ParameterFormProps {
  parameters: Record<string, any>;
  onParameterChange: (key: string, value: any) => void;
  selectedNode?: any;
}

export function NodeInspectorButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useAtom(selectedNodeAtom);
  const [nodes, setNodes] = useAtom(nodesAtom);
  const [edges, setEdges] = useAtom(edgesAtom);
  
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [parameters, setParameters] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedNode) {
      setIsModalOpen(true);
      setLabel(selectedNode.data?.label || "");
      setDescription(selectedNode.data?.description || "");
      setParameters(selectedNode.data?.parameters || {});
    } else {
      setIsModalOpen(false);
    }
  }, [selectedNode]);

  const getNodeCategory = () => {
    return selectedNode?.data?.category || "";
  };

  const handleParameterChange = (key: string, value: any) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveChanges = () => {
    if (!selectedNode) return;

    console.log("Saving node parameters:", {
      nodeId: selectedNode.id,
      parameters,
      category: selectedNode.data?.category,
    });

    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              data: {
                ...node.data,
                label,
                description,
                parameters,
              },
            }
          : node
      )
    );

    toast.success("Node updated successfully");
    setIsModalOpen(false);
  };

  const handleDeleteNode = () => {
    if (!selectedNode) return;

    setNodes((currentNodes) =>
      currentNodes.filter((node) => node.id !== selectedNode.id)
    );

    setEdges((currentEdges) =>
      currentEdges.filter(
        (edge) =>
          edge.source !== selectedNode.id && edge.target !== selectedNode.id
      )
    );

    setSelectedNode(null);
    toast.success("Node deleted successfully");
    setIsModalOpen(false);
  };

  return (
    <>
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false);
            setSelectedNode(null);
          }
        }}
      >
        <DialogContent
          className="bg-[#1A1B23] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-hidden w-[95vw] sm:w-full"
          aria-describedby="node-inspector-description"
        >
          <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-0 sm:pr-8">
            <DialogTitle>Node Inspector</DialogTitle>
            <div id="node-inspector-description" className="sr-only">
              Inspect and edit node properties including label, description, and
              parameters
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveChanges}
                className="bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
                size="sm"
              >
                Save Changes
              </Button>

              <Button
                onClick={handleDeleteNode}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700 cursor-pointer"
                title="Delete Node"
              >
                <Trash2 className="w-4 h-4 " />
              </Button>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh]">
            {selectedNode ? (
              <div className="space-y-4">
                <Card className="bg-[#0B0C10] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Node Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-500 uppercase tracking-wide">
                        ID
                      </Label>
                      <p className="text-sm text-gray-300 mt-1 font-mono">
                        {selectedNode.id}
                      </p>
                    </div>

                    <Separator className="bg-white/10" />

                    <div>
                      <Label className="text-xs text-gray-500 uppercase tracking-wide">
                        Category
                      </Label>
                      <p className="text-sm text-gray-300 mt-1">
                        {selectedNode.data?.category || "N/A"}
                      </p>
                    </div>

                    <Separator className="bg-white/10" />

                    <div>
                      <Label className="text-xs text-gray-500 uppercase tracking-wide">
                        Position
                      </Label>
                      <div className="text-sm text-gray-300 mt-1 font-mono">
                        <p>X: {selectedNode.position.x.toFixed(2)}</p>
                        <p>Y: {selectedNode.position.y.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0B0C10] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Edit Node
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="label" className="text-sm text-gray-300">
                        Label
                      </Label>
                      <Input
                        id="label"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Enter node label"
                        className="bg-[#1A1B23] border-gray-700 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="description"
                        className="text-sm text-gray-300"
                      >
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter node description"
                        rows={3}
                        className="bg-[#1A1B23] border-gray-700 text-white resize-none"
                      />
                    </div>

                    <Separator className="bg-white/10" />

                    <div>
                      <Label className="text-sm text-gray-300 mb-3 block">
                        Parameters
                      </Label>
                      {(() => {
                        const category = getNodeCategory();
                        switch (category) {
                          case "protocol":
                            return (
                              <ProtocolNodeForm
                                parameters={parameters}
                                onParameterChange={handleParameterChange}
                                selectedNode={selectedNode}
                              />
                            );
                          case "memory":
                            return (
                              <MemoryNodeForm
                                parameters={parameters}
                                onParameterChange={handleParameterChange}
                                selectedNode={selectedNode}
                              />
                            );
                          case "communication":
                            return (
                              <CommunicationNodeForm
                                parameters={parameters}
                                onParameterChange={handleParameterChange}
                                selectedNode={selectedNode}
                              />
                            );
                          case "condition":
                            return (
                              <ConditionNodeForm
                                parameters={parameters}
                                onParameterChange={handleParameterChange}
                                selectedNode={selectedNode}
                              />
                            );
                          case "trigger":
                            return (
                              <TriggerNodeForm
                                parameters={parameters}
                                onParameterChange={handleParameterChange}
                                selectedNode={selectedNode}
                              />
                            );
                          case "transform":
                            return (
                              <TransformNodeForm
                                parameters={parameters}
                                onParameterChange={handleParameterChange}
                                selectedNode={selectedNode}
                              />
                            );
                          default:
                            return (
                              <div className="space-y-2">
                                <p className="text-xs text-gray-400">
                                  No custom parameters for this node type.
                                </p>
                              </div>
                            );
                        }
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-400">No node selected</p>
                  <p className="text-xs text-gray-500">
                    Select a node on the canvas to view its details
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
