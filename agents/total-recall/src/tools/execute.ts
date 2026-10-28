import type { Tool } from "../protocol/tools.ts";

export const executeTool: Tool = {
  name: "execute",
  description: "Execute a bounded batch of typed Life OS operations.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["operations", "mode", "idempotencyKey"],
    properties: {
      operations: { type: "array", minItems: 1, maxItems: 20 },
      mode: { enum: ["preview", "commit"] },
      conversationId: { type: "string", maxLength: 200 },
      idempotencyKey: { type: "string", minLength: 1, maxLength: 200 },
    },
  },
};
