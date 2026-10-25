/* Validator input is intentionally unknown at the untrusted MCP boundary. */
/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/require-readable-spacing */

import Ajv, { type ErrorObject } from "ajv";

import { memoryProposeTool } from "../tools/memory-propose.ts";

const ajv = new Ajv({ allErrors: true, strict: true });
const validate = ajv.compile(memoryProposeTool.inputSchema);

export type MemoryValidationResult = { valid: true } | { valid: false; errors: ErrorObject[] };

export function validateMemoryProposal(input: unknown): MemoryValidationResult {
  if (validate(input)) return { valid: true };

  return { valid: false, errors: validate.errors ?? [] };
}
