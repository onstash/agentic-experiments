import type { Tool } from "../protocol/tools.ts";

export const executeTool: Tool = {
  name: "execute",
  description:
    "Execute a bounded batch of typed Life OS operations and return records, analysis, or proposal results. Use this after search. Every operation must contain an id and an input object; do not use args or params. Use the inputSchema returned by search to construct each input object. Use the execution mode declared by each discovered capability: preview may return read results or create a pending proposal, while commit is accepted only when that capability advertises commit support. The server enforces authorization and mode restrictions.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["operations", "mode", "idempotencyKey"],
    properties: {
      operations: {
        type: "array",
        minItems: 1,
        maxItems: 20,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "input"],
          properties: {
            id: { type: "string", minLength: 1, maxLength: 200 },
            input: { type: "object", additionalProperties: true },
          },
        },
      },
      mode: { enum: ["preview", "commit"] },
      conversationId: { type: "string", maxLength: 200 },
      idempotencyKey: { type: "string", minLength: 1, maxLength: 200 },
    },
  },
};
