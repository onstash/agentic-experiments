import Ajv, { type ErrorObject } from "ajv";

import { memoryDecideProposalTool } from "../tools/memory-decide-proposal.ts";
import type { JsonValue } from "./memory-get-proposal.ts";

const validate = new Ajv({ allErrors: true }).compile(memoryDecideProposalTool.inputSchema);

export type DecisionValidationResult = { valid: true } | { valid: false; errors: ErrorObject[] };

export function validateMemoryDecision(input: JsonValue): DecisionValidationResult {
  if (validate(input)) return { valid: true };

  return { valid: false, errors: validate.errors ?? [] };
}
