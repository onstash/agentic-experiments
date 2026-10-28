import Ajv from "ajv";

import type { JsonValue } from "../protocol/tools.ts";

export type ExecuteArguments = {
  operations: Array<{ id: string; input: { [key: string]: JsonValue } }>;
  mode: "preview" | "commit";
  idempotencyKey: string;
  conversationId?: string;
};

const validate = new Ajv({ allErrors: true, strict: true }).compile({
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
    idempotencyKey: { type: "string", minLength: 1, maxLength: 200 },
    conversationId: { type: "string", maxLength: 200 },
  },
});

export type ExecuteValidationError = {
  code: "INVALID_OPERATION_INPUT";
  operation?: string;
  path: string;
  message: string;
};

export function parseExecuteArguments(
  input: JsonValue,
): { value: ExecuteArguments } | { error: ExecuteValidationError } {
  if (!validate(input)) {
    const error = validate.errors?.[0];
    const instancePath = error?.instancePath ?? "";

    const missing =
      error?.keyword === "required" && "missingProperty" in error.params
        ? String(error.params.missingProperty)
        : undefined;

    const path = instancePath
      ? instancePath.replace(/^\//, "").replace("/0", "[0]").replaceAll("/", ".")
      : error?.keyword === "required" && missing
        ? `execute.${missing}`
        : "execute";

    const errorPath = missing && !path.endsWith(`.${missing}`) ? `${path}.${missing}` : path;

    return {
      error: {
        code: "INVALID_OPERATION_INPUT",
        path: errorPath,
        message: missing
          ? `Required field '${missing}' is missing.`
          : (error?.message ?? "Invalid execute arguments."),
      },
    };
  }

  // SAFETY: Ajv validated the required execution envelope before this conversion.
  return { value: input as ExecuteArguments };
}
