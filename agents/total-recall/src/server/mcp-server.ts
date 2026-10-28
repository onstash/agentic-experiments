import { parseJsonRpcRequest, parseToolsCallRequest } from "../protocol/parse.ts";
import type { JsonRpcRequest, JsonRpcResponse } from "../protocol/json-rpc.ts";
import type { InitializeResult, ListToolsResult, ToolsCallResult } from "../protocol/methods.ts";
import type { JsonValue } from "../protocol/tools.ts";
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

export async function handleMessage(
  input: JsonValue,
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
    const toolsCall = parseToolsCallRequest(request.params);

    if (!toolsCall) {
      return failure(request.id, -32602, "Invalid tools/call params");
    }

    return success(request.id, await dispatch(toolsCall));
  }

  return failure(request.id, -32601, `Method not found: ${request.method}`);
}
