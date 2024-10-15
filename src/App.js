import React, { useCallback, useRef } from "react";
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

const initialNodes = [];

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

  const handleACLUpdate = useCallback((parsedAcl) => {
    const newNodes = [];
    const newEdges = [];
    let nodeId = 1;
    const verticalSpacing = 200;
    const horizontalSpacing = 300;
    const destVerticalSpacing = 80;
    const destHorizontalSpacing = 180;
    const maxNodesPerColumn = 5;

    parsedAcl.acls.forEach((rule, ruleIndex) => {
      const baseY = ruleIndex * verticalSpacing;

      const sourceNode = {
        id: `source-${nodeId}`,
        type: 'sourceNode',
        position: { x: 100, y: baseY },
        data: { value: rule.src[0], onChange: (newData) => onNodeDataChange(`source-${nodeId}`, newData) },
      };
      newNodes.push(sourceNode);

      const actionNode = {
        id: `action-${nodeId}`,
        type: 'actionNode',
        position: { x: 100 + horizontalSpacing, y: baseY },
        data: { value: rule.action, onChange: (newData) => onNodeDataChange(`action-${nodeId}`, newData) },
      };
      newNodes.push(actionNode);

      newEdges.push({
        id: `edge-source-action-${nodeId}`,
        source: `source-${nodeId}`,
        target: `action-${nodeId}`,
      });

      rule.dst.forEach((dst, dstIndex) => {
        const [ip, portsString] = dst.split(':');
        const ports = portsString ? portsString.split(',') : ['*'];

        ports.forEach((port, portIndex) => {
          const totalIndex = dstIndex * ports.length + portIndex;
          const columnIndex = Math.floor(totalIndex / maxNodesPerColumn);
          const rowIndex = totalIndex % maxNodesPerColumn;
          const destinationNode = {
            id: `destination-${nodeId}-${dstIndex}-${portIndex}`,
            type: 'destinationNode',
            position: { 
              x: 100 + horizontalSpacing * 2 + columnIndex * destHorizontalSpacing, 
              y: baseY + rowIndex * destVerticalSpacing
            },
            data: { 
              value: `${ip}:${port}`, 
              onChange: (newData) => onNodeDataChange(`destination-${nodeId}-${dstIndex}-${portIndex}`, newData) 
            },
          };
          newNodes.push(destinationNode);

          newEdges.push({
            id: `edge-action-destination-${nodeId}-${dstIndex}-${portIndex}`,
            source: `action-${nodeId}`,
            target: `destination-${nodeId}-${dstIndex}-${portIndex}`,
          });
        });
      });

      nodeId++;
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges, onNodeDataChange]);

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
      <Sidebar nodes={nodes} edges={edges} onACLUpdate={handleACLUpdate} />
    </div>
  );
}

export default App;
