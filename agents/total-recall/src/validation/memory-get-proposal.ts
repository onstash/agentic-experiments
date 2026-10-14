/* JSON-RPC input is parsed by Ajv at this boundary. */

import Ajv, { type ErrorObject } from "ajv";

import { memoryGetProposalTool } from "../tools/memory-get-proposal.ts";

const validate = new Ajv({ allErrors: true }).compile(memoryGetProposalTool.inputSchema);

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type ProposalValidationResult = { valid: true } | { valid: false; errors: ErrorObject[] };

export function validateMemoryGetProposal(input: JsonValue): ProposalValidationResult {
  if (validate(input)) return { valid: true };

  return { valid: false, errors: validate.errors ?? [] };
}
