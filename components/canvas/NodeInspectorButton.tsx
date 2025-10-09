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
import { selectedNodeAtom, nodesAtom, edgesAtom } from "@/lib/state/atoms";
import { toast } from "sonner";
import { Trash2, MessageSquare } from "lucide-react";

export function NodeInspectorButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useAtom(selectedNodeAtom);
  const [nodes, setNodes] = useAtom(nodesAtom);
  const [edges, setEdges] = useAtom(edgesAtom);
  
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [parameters, setParameters] = useState("");
  const [jsonError, setJsonError] = useState("");

  // Auto-open modal when a node is selected, close when no node
  useEffect(() => {
    if (selectedNode) {
      setIsModalOpen(true);
    } else {
      setIsModalOpen(false);
    }
  }, [selectedNode]);

  const handleParametersChange = (value: string) => {
    setParameters(value);
    try {
      if (value.trim()) {
        JSON.parse(value);
        setJsonError("");
      }
    } catch (error) {
      setJsonError("Invalid JSON format");
    }
  };

  const handleSaveChanges = () => {
    if (!selectedNode) return;

    if (jsonError) {
      toast.error("Cannot save: Invalid JSON in parameters");
      return;
    }

    let parsedParameters = {};
    try {
      parsedParameters = parameters.trim() ? JSON.parse(parameters) : {};
    } catch (error) {
      toast.error("Invalid JSON format");
      return;
    }

    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              data: {
                ...node.data,
                label,
                description,
                parameters: parsedParameters,
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

    setNodes((currentNodes) => currentNodes.filter((node) => node.id !== selectedNode.id));
    
    setEdges((currentEdges) => 
      currentEdges.filter(
        (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
      )
    );
    
    setSelectedNode(null);
    toast.success("Node deleted successfully");
    setIsModalOpen(false);
  };

  return (
    <>

      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsModalOpen(false);
          setSelectedNode(null);
        }
      }}>
        <DialogContent 
          className="bg-[#1A1B23] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-hidden"
          aria-describedby="node-inspector-description"
        >
          <DialogHeader className="flex flex-row items-center justify-between pr-8">
            <DialogTitle>Node Inspector</DialogTitle>
            <div id="node-inspector-description" className="sr-only">
              Inspect and edit node properties including label, description, and parameters
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveChanges}
                disabled={!!jsonError}
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
                      <Label htmlFor="description" className="text-sm text-gray-300">
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="parameters" className="text-sm text-gray-300">
                        Parameters (JSON)
                      </Label>
                      <Textarea
                        id="parameters"
                        value={parameters}
                        onChange={(e) => handleParametersChange(e.target.value)}
                        placeholder='{"key": "value"}'
                        rows={6}
                        className={`bg-[#1A1B23] border-gray-700 text-white font-mono text-xs resize-none ${
                          jsonError ? "border-red-500" : ""
                        }`}
                      />
                      {jsonError && (
                        <p className="text-xs text-red-400">{jsonError}</p>
                      )}
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
