/* MCP tool arguments are validated before reaching handlers. */
/* oxlint-disable anti-slop/no-unsafe-dictionary-type, anti-slop/no-known-value-widening, anti-slop/no-unknown-parameters */

import type { CallToolRequest, CallToolResult } from "../protocol/tools.ts";
import { validateMemoryGetProposal, type JsonValue } from "../validation/memory-get-proposal.ts";
import {
  validateMemoryProposal,
  type MemoryValidationResult,
} from "../validation/memory-propose.ts";
import { handleMemoryPropose, type ToolHandler } from "./handlers/memory-propose.ts";

export type ToolDispatcher = (request: CallToolRequest) => Promise<CallToolResult>;

const validators: Record<string, (input: JsonValue) => MemoryValidationResult> = {
  "memory.propose": validateMemoryProposal,
  "memory.get_proposal": validateMemoryGetProposal,
};

const defaultHandlers: Record<string, ToolHandler> = {
  "memory.propose": handleMemoryPropose,
  "memory.get_proposal": async () => ({
    content: [{ type: "text", text: "Life OS client not configured." }],
    isError: true,
  }),
};

export function createToolDispatcher(handlers: Record<string, ToolHandler>): ToolDispatcher {
  return (request) => dispatchTool(request, handlers);
}

export function callTool(request: CallToolRequest): Promise<CallToolResult> {
  return dispatchTool(request, defaultHandlers);
}

async function dispatchTool(
  request: CallToolRequest,
  handlers: Record<string, ToolHandler>,
): Promise<CallToolResult> {
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
    // SAFETY: MCP arguments are JSON values parsed by the protocol boundary.
    const validation = validate(argumentsValue as JsonValue);

    if (!validation.valid) {
      return {
        content: [{ type: "text", text: "Invalid memory proposal arguments." }],
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
