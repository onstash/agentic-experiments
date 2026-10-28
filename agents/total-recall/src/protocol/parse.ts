import Ajv from "ajv";

import type { JsonRpcError, JsonRpcRequest } from "./json-rpc.ts";
import type { ToolsCallRequest } from "./methods.ts";
import type { JsonObject, JsonValue } from "./tools.ts";

export type ParsedJsonRpcRequest =
  | { ok: true; request: JsonRpcRequest }
  | { ok: false; error: JsonRpcError };

const ajv = new Ajv({ strict: true });

const validateRequest = ajv.compile({
  type: "object",
  required: ["jsonrpc", "id", "method"],
  properties: {
    jsonrpc: { const: "2.0" },
    id: {
      anyOf: [{ type: "string", minLength: 1 }, { type: "number" }],
    },
    method: { type: "string", minLength: 1 },
    params: {},
  },
  additionalProperties: true,
});

const validateNotification = ajv.compile({
  type: "object",
  required: ["jsonrpc", "method"],
  not: {
    required: ["id"],
    properties: { id: {} },
  },
  properties: {
    jsonrpc: { const: "2.0" },
    id: {},
    method: { type: "string", minLength: 1 },
  },
  additionalProperties: true,
});

const validateToolsCall = ajv.compile({
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string", minLength: 1 },
    arguments: { type: "object" },
  },
  additionalProperties: true,
});

export function isJsonRpcNotification(input: JsonValue): boolean {
  return validateNotification(input);
}

export function parseJsonRpcRequest(input: JsonValue): ParsedJsonRpcRequest {
  if (!validateRequest(input)) return invalidRequest("Invalid JSON-RPC request");

  // SAFETY: Ajv validated the JSON-RPC request envelope and required fields.
  const value = input as JsonObject;

  // SAFETY: Ajv validated the request id as a non-empty string or finite number.
  const id = value.id as string | number;

  // SAFETY: Ajv validated the request method as a non-empty string.
  const method = value.method as string;

  const request: JsonRpcRequest = {
    jsonrpc: "2.0",
    id,
    method,
  };

  if (value.params !== undefined) request.params = value.params;

  return { ok: true, request };
}

export function parseToolsCallRequest(params: JsonValue | undefined): ToolsCallRequest | null {
  if (!validateToolsCall(params)) return null;

  // SAFETY: Ajv validated the tools/call envelope and string tool name.
  const value = params as JsonObject;
  // SAFETY: Ajv validated the tool name as a non-empty string.
  const name = value.name as string;
  const request: ToolsCallRequest = { name };

  if (value.arguments !== undefined) {
    // SAFETY: Ajv validated the tool arguments as an object.
    request.arguments = value.arguments as JsonObject;
  }

  return request;
}

function invalidRequest(message: string): ParsedJsonRpcRequest {
  return {
    ok: false,
    error: { code: -32600, message },
  };
}
