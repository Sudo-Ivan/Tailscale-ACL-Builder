export const NODE_TYPES = {
  SOURCE: "sourceNode",
  DESTINATION: "destinationNode",
  ACTION: "actionNode",
  TAG: "tagNode",
};

export const NODE_LABELS = {
  [NODE_TYPES.SOURCE]: "Source",
  [NODE_TYPES.DESTINATION]: "Destination",
  [NODE_TYPES.ACTION]: "Action",
  [NODE_TYPES.TAG]: "Tag",
};

export const TAG_PREFIXES = {
  USER: "",
  GROUP: "group:",
  TAG: "tag:",
};

export const VALID_ACTIONS = ["accept", "deny"];
