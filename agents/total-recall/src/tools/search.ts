import type { Tool } from "../protocol/tools.ts";

export const searchTool: Tool = {
  name: "search",
  description: "Discover the typed Life OS capabilities relevant to an intent.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      query: { type: "string", maxLength: 200 },
      limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
    },
  },
};
