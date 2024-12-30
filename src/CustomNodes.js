import React, { useState, useCallback } from "react";
import { Handle } from "@xyflow/react";

const nodeStyle = {
  padding: "10px",
  border: "1px solid #4a4a4a",
  borderRadius: "5px",
  background: "#3a3a3a",
  color: "#ffffff",
  width: "220px",
};

const inputStyle = {
  margin: "5px 0",
  padding: "5px",
  width: "calc(100% - 10px)",
  backgroundColor: "#2a2a2a",
  color: "#ffffff",
  border: "1px solid #4a4a4a",
  borderRadius: "3px",
  boxSizing: "border-box",
};

const NodeContent = ({ type, data, onChange, placeholder }) => {
  const [localData, setLocalData] = useState(data);
  const [error, setError] = useState(null);

  const handleChange = useCallback(
    (e) => {
      const value = e.target.value;
      const newData = { ...localData, [e.target.name]: value };
      
      // Validate input based on node type
      const nodeConfig = NodeTypes[type];
      const isValid = nodeConfig.validate ? nodeConfig.validate(value) : true;
      setError(isValid ? null : 'Invalid format');
      
      setLocalData(newData);
      onChange(newData);
    },
    [localData, onChange, type],
  );

  return (
    <div>
      <div>{type}</div>
      <input
        style={{
          ...inputStyle,
          borderColor: error ? '#ff6060' : '#4a4a4a'
        }}
        name="value"
        value={localData.value || ""}
        onChange={handleChange}
        placeholder={placeholder}
      />
      {error && <div style={{ color: '#ff6060', fontSize: '0.8em' }}>{error}</div>}
    </div>
  );
};

const NodeTypes = {
  sourceNode: {
    placeholder: "Enter user, group:name, or tag:name",
    width: "220px",
    handleConfig: [{ type: "source", position: "right" }],
    validate: (value) => {
      // Validate user email, group:name, or tag:name format
      return value.match(/^([a-zA-Z0-9_.-]+@[a-zA-Z0-9_.-]+|group:[a-zA-Z0-9_-]+|tag:[a-zA-Z0-9_-]+)$/);
    }
  },
  destinationNode: {
    placeholder: "Enter IP:port",
    width: "120px",
    handleConfig: [{ type: "target", position: "left" }],
    validate: (value) => {
      // Validate IP:port format
      return value.match(/^[0-9.:/*]+$/);
    }
  },
  actionNode: {
    placeholder: "Enter action (accept/deny)",
    width: "220px",
    handleConfig: [
      { type: "target", position: "left" },
      { type: "source", position: "right" },
    ],
    validate: (value) => {
      return ["accept", "deny"].includes(value.toLowerCase());
    }
  },
  tagNode: {
    placeholder: "Enter tag name",
    width: "220px",
    handleConfig: [
      { type: "target", position: "left" },
      { type: "source", position: "right" },
    ],
    validate: (value) => {
      return value.match(/^tag:[a-zA-Z0-9_-]+$/);
    }
  }
};

const BaseNode = ({ type, data, isConnectable, style = {} }) => {
  const nodeConfig = NodeTypes[type];
  
  return (
    <div style={{
      ...nodeStyle,
      ...style,
      width: nodeConfig.width
    }}>
      {nodeConfig.handleConfig.map(({ type, position }) => (
        <Handle 
          key={`${type}-${position}`}
          type={type}
          position={position}
          isConnectable={isConnectable}
        />
      ))}
      <NodeContent 
        type={type}
        data={data}
        onChange={data.onChange}
        placeholder={nodeConfig.placeholder}
      />
    </div>
  );
};

export const SourceNode = (props) => <BaseNode type="sourceNode" {...props} />;
export const DestinationNode = (props) => (
  <BaseNode 
    type="destinationNode"
    style={{ fontSize: "0.8em", padding: "5px" }}
    {...props}
  />
);
export const ActionNode = (props) => <BaseNode type="actionNode" {...props} />;
export const TagNode = (props) => <BaseNode type="tagNode" {...props} />;
