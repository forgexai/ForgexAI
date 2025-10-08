"use client";

import { useCallback, useRef, useState } from "react";
import { useAtom } from "jotai";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Node,
  ReactFlowProvider,
  ReactFlowInstance,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import { nodesAtom, edgesAtom, selectedNodeAtom } from "@/lib/state/atoms";
import { ConditionNode } from "@/components/nodes/ConditionNode";
import { SolanaNode } from "@/components/nodes/SolanaNode";
import { TelegramNode } from "@/components/nodes/TelegramNode";
import { FloatingToolbar } from "@/components/dashboard/FloatingToolbar";
import type { NodeTypes } from "reactflow";

const nodeTypes: NodeTypes = {
  condition: ConditionNode,
  solana: SolanaNode,
  telegram: TelegramNode,
};

function FlowCanvas() {
  const [nodes, setNodes] = useAtom(nodesAtom);
  const [edges, setEdges] = useAtom(edgesAtom);
  const [selectedNode, setSelectedNode] = useAtom(selectedNodeAtom);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const onNodesChange = useCallback(
    (changes: any) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      
      changes.forEach((change: any) => {
        if (change.type === "select" && change.selected) {
          const node = nodes.find((n) => n.id === change.id);
          if (node) setSelectedNode(node);
        }
      });
    },
    [setNodes, nodes, setSelectedNode]
  );

  const onEdgesChange = useCallback(
    (changes: any) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");

      if (!type || !reactFlowBounds || !reactFlowInstance) {
        return;
      }

      try {
        const nodeData = JSON.parse(type);
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const getNodeType = (category: string) => {
          switch (category) {
            case "Logic":
              return "condition";
            case "Solana":
              return "solana";
            case "Output":
              return "telegram";
            default:
              return "default";
          }
        };

        const newNode: Node = {
          id: `${nodeData.id}-${Date.now()}`,
          type: getNodeType(nodeData.category),
          position,
          data: { 
            label: nodeData.label,
            category: nodeData.category 
          },
        };

        setNodes((nds) => [...nds, newNode]);
      } catch (error) {
        console.error("Error adding node:", error);
      }
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div ref={reactFlowWrapper} className="flex-1 bg-[#0B0C10] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setReactFlowInstance}
        fitView
        className="bg-[#0B0C10]"
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: "#9945FF", strokeWidth: 2 },
        }}
        connectionLineStyle={{ stroke: "#9945FF", strokeWidth: 2 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.1}
        maxZoom={4}
        zoomOnScroll={true}
        panOnScroll={false}
        zoomOnDoubleClick={false}
        selectNodesOnDrag={false}
      >
        <Background 
          variant="dots" 
          gap={16} 
          size={1} 
          color="#374151"
        />
        <MiniMap 
          nodeColor="#9945FF"
          maskColor="rgba(0, 0, 0, 0.6)"
          className="bg-[#1A1B23] border border-white/10 rounded-lg"
        />
        <Controls className="bg-[#1A1B23] border border-white/10 rounded-lg" />
        <FloatingToolbar />
      </ReactFlow>
    </div>
  );
}

export function CanvasArea() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
