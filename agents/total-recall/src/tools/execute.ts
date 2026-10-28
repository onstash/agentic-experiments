import type { Tool } from "../protocol/tools.ts";

export const executeTool: Tool = {
  name: "execute",
  description:
    "Execute a bounded batch of typed Life OS operations and return their records or analysis. Use this after search to retrieve projects, tasks, notes, memories, or review results. Every operation must contain an id and an input object; do not use args or params. Use the inputSchema returned by search to construct each input object. Read operations use preview mode; commit mode is only for explicitly approved changes.",
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
