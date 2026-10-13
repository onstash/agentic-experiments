/* MCP tool arguments are validated before reaching handlers. */
/* oxlint-disable anti-slop/no-unsafe-dictionary-type, anti-slop/no-known-value-widening, anti-slop/no-unknown-parameters */

import type { CallToolRequest, CallToolResult } from "../protocol/tools.ts";
import {
  validateMemoryProposal,
  type MemoryValidationResult,
} from "../validation/memory-propose.ts";
import { handleMemoryPropose } from "./handlers/memory-propose.ts";

export type ToolHandler = (args: Record<string, unknown>) => Promise<CallToolResult>;

const handlers: Record<string, ToolHandler> = {
  "memory.propose": handleMemoryPropose,
};

const validators: Record<string, (input: unknown) => MemoryValidationResult> = {
  "memory.propose": validateMemoryProposal,
};

export async function callTool(request: CallToolRequest): Promise<CallToolResult> {
  const handler = handlers[request.name];

  if (!handler) {
    return {
      content: [{ type: "text", text: `Unknown tool: ${request.name}` }],
      isError: true,
    };
  }

  const argumentsValue = request.arguments ?? {};
  const validate = validators[request.name];

  if (validate) {
    const validation = validate(argumentsValue);

    if (!validation.valid) {
      return {
        content: [
          {
            type: "text",
            text: "Invalid memory proposal arguments.",
          },
        ],
        structuredContent: {
          status: "invalid_arguments",
          errors: validation.errors,
        },
        isError: true,
      };
    }
  }

  return handler(argumentsValue);
}
