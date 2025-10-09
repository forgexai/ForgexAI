"use client";

import { useCallback, useRef, useState, useEffect } from "react";
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

  useEffect(() => {
    const handleAddNode = (event: CustomEvent) => {
      const { type, label, category } = event.detail;
      
      if (!reactFlowInstance) return;

      const getNodeType = (category: string) => {
        switch (category) {
          case "Core":
            return "condition";
          case "Logic":
            return "condition";
          case "Solana":
            return "solana";
          case "Data":
            return "condition";
          case "Output":
            return "telegram";
          default:
            return "condition";
        }
      };

      const position = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: getNodeType(category),
        position,
        data: { 
          label,
          category 
        },
      };

      setNodes((nds) => [...nds, newNode]);
    };

    window.addEventListener('addNode', handleAddNode as EventListener);
    return () => {
      window.removeEventListener('addNode', handleAddNode as EventListener);
    };
  }, [reactFlowInstance, setNodes]);

  // Update existing edges to use orange color
  useEffect(() => {
    setEdges((eds) => eds.map(edge => ({
      ...edge,
      style: { stroke: "#f97316", strokeWidth: 2 },
      animated: true
    })));
  }, [setEdges]);

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
      setEdges((eds) => addEdge({
        ...connection,
        style: { stroke: "#f97316", strokeWidth: 2 },
        animated: true
      }, eds));
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
    <div ref={reactFlowWrapper} className="flex-1 bg-[#111827] relative" style={{ height: '100%', width: '100%' }}>
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
        style={{ width: '100%', height: '100%' }}
        className="bg-[#111827]"
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Meta', 'Ctrl']}
        selectionKeyCode={['Meta', 'Ctrl']}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: "#f97316", strokeWidth: 2 },
        }}
        connectionLineStyle={{ stroke: "#f97316", strokeWidth: 2 }}
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
          gap={20} 
          size={1.5} 
          color="#6B7280"
        />
        <MiniMap 
          nodeColor="#f97316"
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
