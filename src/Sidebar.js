import React, { useState, useCallback, useEffect, useMemo } from "react";
import "./App.css";

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Simple HuJSON parser
const parseHuJSON = (input) => {
  // Remove comments
  const withoutComments = input.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");
  // Handle trailing commas
  const withoutTrailingCommas = withoutComments.replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(withoutTrailingCommas);
};

const Sidebar = ({ nodes, edges, onACLUpdate }) => {
  const [aclJson, setAclJson] = useState("");
  const [alert, setAlert] = useState("");

  const generateACL = useCallback(() => {
    const acl = {
      acls: [],
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

    const ruleMap = new Map();

    edges.forEach((edge) => {
      const source = nodes.find((node) => node.id === edge.source);
      const target = nodes.find((node) => node.id === edge.target);

      if (!source || !target || !source.data || !target.data) return;

      if (source.type === "sourceNode" && target.type === "actionNode") {
        const ruleKey = `${source.data.value || ""}-${target.data.value || ""}`;
        if (!ruleMap.has(ruleKey)) {
          ruleMap.set(ruleKey, {
            action: target.data.value || "",
            src: [source.data.value || ""],
            dst: [],
          });
        }
      } else if (
        source.type === "actionNode" &&
        target.type === "destinationNode"
      ) {
        const sourceEdge = edges.find(
          (e) =>
            e.target === source.id &&
            nodes.find((n) => n.id === e.source)?.type === "sourceNode",
        );
        if (!sourceEdge) return;

        const sourceNode = nodes.find((node) => node.id === sourceEdge.source);
        if (!sourceNode || !sourceNode.data) return;

        const ruleKey = `${sourceNode.data.value || ""}-${source.data.value || ""}`;
        const rule = ruleMap.get(ruleKey);
        if (rule && target.data.value) {
          const [ip, port] = target.data.value.split(":");
          if (ip && port) {
            const existingDst = rule.dst.find((d) => d.startsWith(ip + ":"));
            if (existingDst) {
              const ports = existingDst.split(":")[1].split(",");
              if (!ports.includes(port)) {
                ports.push(port);
                rule.dst[rule.dst.indexOf(existingDst)] =
                  `${ip}:${ports.join(",")}`;
              }
            } else {
              rule.dst.push(target.data.value);
            }
          }
        }
      }
    });

    acl.acls = Array.from(ruleMap.values());
    return JSON.stringify(acl, null, 2);
  }, [nodes, edges]);

  useEffect(() => {
    setAclJson(generateACL());
  }, [nodes, edges, generateACL]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(aclJson).then(
      () => {
        setAlert("ACL JSON copied to clipboard!");
        setTimeout(() => setAlert(""), 3000);
      },
      (err) => {
        console.error("Could not copy text: ", err);
        setAlert("Failed to copy ACL JSON.");
        setTimeout(() => setAlert(""), 3000);
      },
    );
  }, [aclJson]);

  const validateAndFormatACL = useCallback((jsonString) => {
    try {
      const parsed = parseHuJSON(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      setAclJson(jsonString); // Keep the original input with comments
      setAlert("");
      return { isValid: true, formatted: formatted, original: jsonString };
    } catch (error) {
      setAlert("Invalid HuJSON. Please check your ACL configuration.");
      return { isValid: false, formatted: jsonString, original: jsonString };
    }
  }, []);

  const debouncedValidateAndFormat = useMemo(
    () => debounce(validateAndFormatACL, 300),
    [validateAndFormatACL],
  );

  const handleAclChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      setAclJson(newValue);
      debouncedValidateAndFormat(newValue);
    },
    [debouncedValidateAndFormat],
  );

  const validateACL = (parsedAcl) => {
    const unsupportedFeatures = [];
    if (parsedAcl.groups) unsupportedFeatures.push("groups");
    if (parsedAcl.hosts) unsupportedFeatures.push("hosts");
    if (parsedAcl.tagOwners) unsupportedFeatures.push("tagOwners");
    if (parsedAcl.autoApprovers) unsupportedFeatures.push("autoApprovers");
    if (parsedAcl.ssh && parsedAcl.ssh.some((rule) => rule.checkPeriod))
      unsupportedFeatures.push("SSH checkPeriod");

    return unsupportedFeatures;
  };

  const handleVisualize = useCallback(() => {
    const { isValid, formatted, original } = validateAndFormatACL(aclJson);
    if (isValid) {
      const parsedAcl = JSON.parse(formatted);
      const unsupportedFeatures = validateACL(parsedAcl);

      if (unsupportedFeatures.length > 0) {
        setAlert(
          `Warning: The following features are not fully supported in visualization: ${unsupportedFeatures.join(", ")}`,
        );
      } else {
        setAlert("");
      }

      onACLUpdate(parsedAcl);
      setAclJson(original); // Keep the original input with comments
    }
  }, [aclJson, onACLUpdate, validateAndFormatACL]);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Tailscale ACL HuJSON</h2>
        <button onClick={handleCopy} className="copy-button">
          Copy
        </button>
        <button onClick={handleVisualize} className="visualize-button">
          Visualize
        </button>
      </div>
      {alert && <div className="alert">{alert}</div>}
      <div className="sidebar-content">
        <textarea
          className="acl-json"
          value={aclJson}
          onChange={handleAclChange}
          placeholder="Paste your ACL JSON here..."
        />
      </div>
    </div>
  );
};

export default Sidebar;
