import type { Tool } from "../protocol/tools.ts";

const memoryScopeSchema = {
  oneOf: [
    {
      type: "object",
      additionalProperties: false,
      required: ["type"],
      properties: { type: { const: "global" } },
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["type", "id"],
      properties: {
        type: { const: "project" },
        id: { type: "string", minLength: 1 },
      },
    },
  ],
};

const memoryItemSchema = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "content", "scope"],
  properties: {
    content: { type: "string", minLength: 1, maxLength: 4000 },
    kind: { enum: ["preference", "project_context", "rule"] },
    scope: memoryScopeSchema,
    sourceRef: { type: "string", maxLength: 500 },
    sourceExcerpt: { type: "string", maxLength: 1000 },
  },
};

export const memoryProposeTool: Tool = {
  name: "memory.propose",
  description: "Propose durable memory for user approval.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["items", "idempotencyKey"],
    properties: {
      items: {
        type: "array",
        minItems: 1,
        maxItems: 50,
        items: memoryItemSchema,
      },
      idempotencyKey: { type: "string", minLength: 1, maxLength: 200 },
    },
  },
};
