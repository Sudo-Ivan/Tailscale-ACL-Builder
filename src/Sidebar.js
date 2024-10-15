import React, { useCallback } from "react";
import "./App.css";

const Sidebar = ({ nodes, edges }) => {
  const generateACL = () => {
    const acl = {
      acls: edges.map((edge) => {
        const source = nodes.find((node) => node.id === edge.source);
        const target = nodes.find((node) => node.id === edge.target);
        return {
          action: "accept",
          src: [source.data.value],
          dst: [`${target.data.value}`],
        };
      }),
      ssh: [
        {
          action: "check",
          src: ["autogroup:member"],
          dst: ["autogroup:self"],
          users: ["autogroup:nonroot", "root"],
        },
      ],
      nodeAttrs: [],
    };
    return JSON.stringify(acl, null, 2);
  };

  const handleCopy = useCallback(() => {
    const aclJson = generateACL();
    navigator.clipboard.writeText(aclJson).then(
      () => {
        alert("ACL JSON copied to clipboard!");
      },
      (err) => {
        console.error("Could not copy text: ", err);
      }
    );
  }, [nodes, edges]);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Tailscale ACL JSON</h2>
        <button onClick={handleCopy} className="copy-button">
          Copy ACL
        </button>
      </div>
      <div className="sidebar-content">
        <pre className="acl-json">
          <code>{generateACL()}</code>
        </pre>
      </div>
    </div>
  );
};

export default Sidebar;
