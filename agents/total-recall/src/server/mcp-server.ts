/* MCP params arrive as untrusted JSON and are narrowed at this boundary. */
/* oxlint-disable anti-slop/no-runtime-typeof, anti-slop/no-unknown-parameters */

import { parseJsonRpcRequest } from "../protocol/parse.ts";
import type { JsonRpcRequest, JsonRpcResponse } from "../protocol/json-rpc.ts";
import type {
  InitializeResult,
  ListToolsResult,
  ToolsCallRequest,
  ToolsCallResult,
} from "../protocol/methods.ts";
import { callTool, type ToolDispatcher } from "./dispatcher.ts";
import { listTools } from "./registry.ts";

function success<TResult>(id: JsonRpcRequest["id"], result: TResult): JsonRpcResponse<TResult> {
  return { jsonrpc: "2.0", id, result };
}

function failure(
  id: JsonRpcRequest["id"] | null,
  code: number,
  message: string,
): JsonRpcResponse<never> {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function isToolsCallRequest(params: unknown): params is ToolsCallRequest {
  return (
    typeof params === "object" &&
    params !== null &&
    "name" in params &&
    typeof params.name === "string"
  );
}

export async function handleMessage(
  input: unknown,
  dispatch: ToolDispatcher = callTool,
): Promise<JsonRpcResponse<InitializeResult | ListToolsResult | ToolsCallResult>> {
  const parsed = parseJsonRpcRequest(input);

  if (!parsed.ok) {
    return {
      jsonrpc: "2.0",
      id: null,
      error: parsed.error,
    };
  }

  return handleRequest(parsed.request, dispatch);
}

export async function handleRequest(
  request: JsonRpcRequest,
  dispatch: ToolDispatcher = callTool,
): Promise<JsonRpcResponse<InitializeResult | ListToolsResult | ToolsCallResult>> {
  if (request.method === "initialize") {
    return success(request.id, {
      protocolVersion: "2025-06-18",
      capabilities: { tools: {} },
      serverInfo: { name: "total-recall", version: "0.1.0" },
    });
  }

  if (request.method === "tools/list") {
    return success(request.id, { tools: listTools() });
  }

  if (request.method === "tools/call") {
    if (!isToolsCallRequest(request.params)) {
      return failure(request.id, -32602, "Invalid tools/call params");
    }

    return success(request.id, await dispatch(request.params));
  }

  return failure(request.id, -32601, `Method not found: ${request.method}`);
}
