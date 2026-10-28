import Ajv, { type ErrorObject } from "ajv";
import type { JsonValue } from "../protocol/tools.ts";

export type SearchArguments = {
  query?: string;
  limit?: number;
};

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    query: { type: "string", maxLength: 200 },
    limit: { type: "integer", minimum: 1, maximum: 50 },
  },
};

const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);

export type SearchValidationResult =
  | { valid: true; value: SearchArguments }
  | { valid: false; errors: ErrorObject[] };

export function parseSearchArguments(input: JsonValue): SearchValidationResult {
  if (!validate(input)) return { valid: false, errors: validate.errors ?? [] };

  // SAFETY: Ajv validated the object shape and property types against schema.
  return { valid: true, value: input as SearchArguments };
}
