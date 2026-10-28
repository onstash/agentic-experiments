import type { Tool } from "../protocol/tools.ts";

export const searchTool: Tool = {
  name: "search",
  description:
    "Discover typed Life OS capabilities for an intent. Capability discovery only; this does not return Life OS records. Use execute to retrieve projects, tasks, notes, or memories.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      query: { type: "string", maxLength: 200 },
      limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
    },
  },
};
