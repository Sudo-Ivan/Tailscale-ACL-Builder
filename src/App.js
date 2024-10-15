import React, { useCallback, useState, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { SourceNode, DestinationNode, ActionNode } from "./CustomNodes";
import Sidebar from "./Sidebar";
import "./App.css";

const nodeTypes = {
  sourceNode: SourceNode,
  destinationNode: DestinationNode,
  actionNode: ActionNode,
};

const initialNodes = [
  {
    id: "1",
    type: "input",
    data: { label: "Start Building ACL" },
    position: { x: 250, y: 25 },
  },
];

const initialEdges = [];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowWrapper = useRef(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeDataChange = useCallback(
    (nodeId, newData) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...newData } };
          }
          return node;
        }),
      );
    },
    [setNodes],
  );

  const addNode = (type) => {
    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = {
      x: Math.random() * (reactFlowBounds.width - 200) + 100,
      y: Math.random() * (reactFlowBounds.height - 100) + 50,
    };

    const newNode = {
      id: String(nodes.length + 1),
      type: type,
      data: {
        label: `New ${type}`,
        onChange: (newData) =>
          onNodeDataChange(String(nodes.length + 1), newData),
      },
      position: position,
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const onNodesDelete = useCallback(
    (deleted) => {
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            !deleted.some(
              (node) => node.id === edge.source || node.id === edge.target,
            ),
        ),
      );
    },
    [setEdges],
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Delete") {
        const selectedNodes = nodes.filter((node) => node.selected);
        if (selectedNodes.length > 0) {
          setNodes((nds) => nds.filter((node) => !node.selected));
          onNodesDelete(selectedNodes);
        }
      }
    },
    [nodes, setNodes, onNodesDelete],
  );

  const resetFlow = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  };

  return (
    <div className="app-container" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="flow-container" ref={reactFlowWrapper}>
        <div className="button-container">
          <button onClick={() => addNode("sourceNode")}>Add Source</button>
          <button onClick={() => addNode("destinationNode")}>
            Add Destination
          </button>
          <button onClick={() => addNode("actionNode")}>Add Action</button>
          <button onClick={resetFlow}>Reset</button>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          nodeTypes={nodeTypes}
          colorMode="dark"
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
      <Sidebar nodes={nodes} edges={edges} />
    </div>
  );
}

export default App;
