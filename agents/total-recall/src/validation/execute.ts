import Ajv from "ajv";

import type { JsonValue } from "../protocol/tools.ts";

export type ExecuteArguments = {
  operations: Array<{ id: string; input?: { [key: string]: JsonValue } }>;
  mode: "preview" | "commit";
  idempotencyKey: string;
  conversationId?: string;
};

const validate = new Ajv({ allErrors: true, strict: true }).compile({
  type: "object",
  additionalProperties: false,
  required: ["operations", "mode", "idempotencyKey"],
  properties: {
    operations: { type: "array", minItems: 1, maxItems: 20 },
    mode: { enum: ["preview", "commit"] },
    idempotencyKey: { type: "string", minLength: 1, maxLength: 200 },
    conversationId: { type: "string", maxLength: 200 },
  },
});

export function parseExecuteArguments(input: JsonValue): ExecuteArguments | null {
  if (!validate(input)) return null;

  // SAFETY: Ajv validated the required execution envelope before this conversion.
  return input as ExecuteArguments;
}
