import React, { useState, useCallback } from "react";
import { Handle } from "@xyflow/react";

const nodeStyle = {
  padding: "10px",
  border: "1px solid #4a4a4a",
  borderRadius: "5px",
  background: "#3a3a3a",
  color: "#ffffff",
  width: "200px",
};

const inputStyle = {
  margin: "5px 0",
  padding: "5px",
  width: "100%",
  backgroundColor: "#2a2a2a",
  color: "#ffffff",
  border: "1px solid #4a4a4a",
  borderRadius: "3px",
};

const NodeContent = ({ type, data, onChange }) => {
  const [localData, setLocalData] = useState(data);

  const handleChange = useCallback(
    (e) => {
      const newData = { ...localData, [e.target.name]: e.target.value };
      setLocalData(newData);
      onChange(newData);
    },
    [localData, onChange],
  );

  return (
    <div>
      <div>{type}</div>
      <input
        style={inputStyle}
        name="value"
        value={localData.value || ""}
        onChange={handleChange}
        placeholder={
          type === "Source"
            ? "Enter user or group"
            : type === "Destination"
              ? "Enter IP:port"
              : "Enter action"
        }
      />
    </div>
  );
};

export const SourceNode = ({ data, isConnectable }) => (
  <div style={nodeStyle}>
    <Handle type="source" position="right" isConnectable={isConnectable} />
    <NodeContent type="Source" data={data} onChange={data.onChange} />
  </div>
);

export const DestinationNode = ({ data, isConnectable }) => (
  <div style={nodeStyle}>
    <Handle type="target" position="left" isConnectable={isConnectable} />
    <NodeContent type="Destination" data={data} onChange={data.onChange} />
  </div>
);

export const ActionNode = ({ data, isConnectable }) => (
  <div style={nodeStyle}>
    <Handle type="target" position="left" isConnectable={isConnectable} />
    <Handle type="source" position="right" isConnectable={isConnectable} />
    <NodeContent type="Action" data={data} onChange={data.onChange} />
  </div>
);
