import React, { useCallback, useRef, useState } from "react";
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
import { SourceNode, DestinationNode, ActionNode, TagNode } from "./CustomNodes";
import Sidebar from "./Sidebar";
import SearchBar from "./components/SearchBar";
import ImportExportButtons from "./components/ImportExportButtons";
import { validateACLSyntax } from "./utils/aclValidation";
import "./App.css";
import { NODE_TYPES, VALID_ACTIONS } from "./constants";

const nodeTypes = {
  sourceNode: SourceNode,
  destinationNode: DestinationNode,
  actionNode: ActionNode,
  tagNode: TagNode,
};

const initialNodes = [];
const initialEdges = [];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [validationErrors, setValidationErrors] = useState([]);
  const reactFlowWrapper = useRef(null);

  const validateNode = useCallback((node) => {
    const errors = [];
    
    switch (node.type) {
      case NODE_TYPES.SOURCE:
        if (!node.data.value.match(/^([a-zA-Z0-9_.-]+@[a-zA-Z0-9_.-]+|group:[a-zA-Z0-9_-]+|tag:[a-zA-Z0-9_-]+)$/)) {
          errors.push(`Invalid source format: ${node.data.value}`);
        }
        break;
      case NODE_TYPES.ACTION:
        if (!VALID_ACTIONS.includes(node.data.value.toLowerCase())) {
          errors.push(`Invalid action: ${node.data.value}`);
        }
        break;
      case NODE_TYPES.DESTINATION:
        if (!node.data.value.match(/^[0-9.:/*]+$/)) {
          errors.push(`Invalid destination format: ${node.data.value}`);
        }
        break;
      case NODE_TYPES.TAG:
        if (!node.data.value.match(/^tag:[a-zA-Z0-9_-]+$/)) {
          errors.push(`Invalid tag format: ${node.data.value}`);
        }
        break;
      default:
        errors.push(`Unknown node type: ${node.type}`);
        break;
    }
    return errors;
  }, []);

  const onNodeDataChange = useCallback(
    (nodeId, newData) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const updatedNode = { ...node, data: { ...node.data, ...newData } };
            const errors = validateNode(updatedNode);
            if (errors.length > 0) {
              setValidationErrors(errors);
            } else {
              setValidationErrors([]);
            }
            return updatedNode;
          }
          return node;
        })
      );
    },
    [setNodes, validateNode]
  );

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const addNode = useCallback(
    (type) => {
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: Math.random() * (reactFlowBounds.width - 200) + 100,
        y: Math.random() * (reactFlowBounds.height - 100) + 50,
      };

      const id = `${type}-${Date.now()}`;
      const newNode = {
        id,
        type,
        data: {
          label: `New ${type}`,
          value: "",
          onChange: (newData) => onNodeDataChange(id, newData),
        },
        position,
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [onNodeDataChange, setNodes]
  );

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

  const resetFlow = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [setNodes, setEdges]);

  const handleACLUpdate = useCallback(
    (parsedAcl) => {
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
          type: "sourceNode",
          position: { x: 100, y: baseY },
          data: {
            value: rule.src[0],
            onChange: (newData) =>
              onNodeDataChange(`source-${nodeId}`, newData),
          },
        };
        newNodes.push(sourceNode);

        const actionNode = {
          id: `action-${nodeId}`,
          type: "actionNode",
          position: { x: 100 + horizontalSpacing, y: baseY },
          data: {
            value: rule.action,
            onChange: (newData) =>
              onNodeDataChange(`action-${nodeId}`, newData),
          },
        };
        newNodes.push(actionNode);

        newEdges.push({
          id: `edge-source-action-${nodeId}`,
          source: `source-${nodeId}`,
          target: `action-${nodeId}`,
        });

        rule.dst.forEach((dst, dstIndex) => {
          const [ip, portsString] = dst.split(":");
          const ports = portsString ? portsString.split(",") : ["*"];

          ports.forEach((port, portIndex) => {
            const totalIndex = dstIndex * ports.length + portIndex;
            const columnIndex = Math.floor(totalIndex / maxNodesPerColumn);
            const rowIndex = totalIndex % maxNodesPerColumn;
            const destinationNode = {
              id: `destination-${nodeId}-${dstIndex}-${portIndex}`,
              type: "destinationNode",
              position: {
                x:
                  100 +
                  horizontalSpacing * 2 +
                  columnIndex * destHorizontalSpacing,
                y: baseY + rowIndex * destVerticalSpacing,
              },
              data: {
                value: `${ip}:${port}`,
                onChange: (newData) =>
                  onNodeDataChange(
                    `destination-${nodeId}-${dstIndex}-${portIndex}`,
                    newData,
                  ),
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
    },
    [setNodes, setEdges, onNodeDataChange],
  );

  const handleImport = useCallback(async (content) => {
    try {
      const parsedContent = JSON.parse(content);
      const errors = validateACLSyntax(parsedContent);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
      
      const nodeErrors = nodes.flatMap(validateNode);
      if (nodeErrors.length > 0) {
        setValidationErrors(nodeErrors);
        return;
      }
      
      handleACLUpdate(parsedContent);
      setValidationErrors([]);
    } catch (err) {
      setValidationErrors(['Invalid JSON format']);
    }
  }, [handleACLUpdate, nodes, validateNode]);

  const exportToJson = useCallback(() => {
    const flowData = {
      nodes: nodes.map(({ id, type, position, data }) => ({
        id,
        type,
        position,
        data: { value: data.value },
      })),
      edges,
    };
    const dataStr = JSON.stringify(flowData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataUri);
    downloadAnchor.setAttribute("download", "flow-export.json");
    downloadAnchor.click();
  }, [nodes, edges]);

  const handleSearch = useCallback((query) => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        hidden: query
          ? !node.data.value.toLowerCase().includes(query.toLowerCase())
          : false,
      }))
    );
  }, [setNodes]);

  return (
    <div className="app-container" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="flow-container" ref={reactFlowWrapper}>
        <div className="button-container">
          {Object.values(NODE_TYPES).map((type) => (
            <button key={type} onClick={() => addNode(type)}>
              Add {type.replace("Node", "")}
            </button>
          ))}
          <button onClick={resetFlow}>Reset</button>
        </div>
        
        <SearchBar onSearch={handleSearch} />
        
        <ImportExportButtons 
          onImport={handleImport}
          onExport={exportToJson}
        />

        {validationErrors.length > 0 && (
          <div className="alert">
            {validationErrors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          nodeTypes={nodeTypes}
          colorMode="dark"
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
      <Sidebar 
        nodes={nodes} 
        edges={edges} 
        onACLUpdate={handleACLUpdate}
        validationErrors={validationErrors}
      />
    </div>
  );
}

export default App;
