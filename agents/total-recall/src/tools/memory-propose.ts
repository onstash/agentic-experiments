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
      required: ["type", "projectId"],
      properties: {
        type: { const: "project" },
        projectId: { type: "string", minLength: 1 },
      },
    },
  ],
};

const commonMemoryProperties = {
  content: {
    type: "string",
    minLength: 1,
    maxLength: 1000,
  },
  scope: memoryScopeSchema,
  sourceRef: {
    type: "string",
    maxLength: 500,
  },
  sourceExcerpt: {
    type: "string",
    maxLength: 500,
  },
};

const semanticMemoryItemSchema = {
  type: "object",
  additionalProperties: false,
  required: ["class", "kind", "content", "scope"],
  properties: {
    ...commonMemoryProperties,
    class: { const: "semantic" },
    kind: {
      enum: ["fact", "preference", "project_context"],
    },
  },
};

const proceduralMemoryItemSchema = {
  type: "object",
  additionalProperties: false,
  required: ["class", "kind", "content", "scope"],
  properties: {
    ...commonMemoryProperties,
    class: { const: "procedural" },
    kind: { const: "rule" },
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
        maxItems: 20,
        items: {
          oneOf: [semanticMemoryItemSchema, proceduralMemoryItemSchema],
        },
      },
      idempotencyKey: {
        type: "string",
        minLength: 1,
      },
    },
  },
};
