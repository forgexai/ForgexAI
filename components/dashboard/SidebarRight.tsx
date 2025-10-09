"use client";

import { useAtom } from "jotai";
import { useState, useEffect } from "react";
import { selectedNodeAtom, nodesAtom, edgesAtom } from "@/lib/state/atoms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function SidebarRight() {
  const [selectedNode, setSelectedNode] = useAtom(selectedNodeAtom);
  const [nodes, setNodes] = useAtom(nodesAtom);
  const [edges, setEdges] = useAtom(edgesAtom);
  
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [parameters, setParameters] = useState("");
  const [jsonError, setJsonError] = useState("");

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data?.label || "");
      setDescription(selectedNode.data?.description || "");
      setParameters(
        selectedNode.data?.parameters 
          ? JSON.stringify(selectedNode.data.parameters, null, 2)
          : "{}"
      );
      setJsonError("");
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
  };

  return (
    <div className="w-80 bg-[#1A1B23] border-l border-white/10 flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex-shrink-0">
        <h2 className="text-lg font-semibold">Node Inspector</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
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
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveChanges}
                    disabled={!!jsonError}
                    className="flex-1  bg-[#9945FF] hover:bg-[#7d3acc] text-white cursor-pointer"
                  >
                    Save Changes
                  </Button>
                  
                  <Button
                    onClick={handleDeleteNode}
                    variant="destructive"
                    size="icon"
                    className="bg-red-600 hover:bg-red-700 cursor-pointer"
                    title="Delete Node"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-400">No node selected</p>
              <p className="text-xs text-gray-500">
                Select a node on the canvas to view its details
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
