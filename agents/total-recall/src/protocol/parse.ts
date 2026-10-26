/* oxlint-disable anti-slop/no-runtime-typeof, anti-slop/no-unknown-parameters, anti-slop/no-unsafe-dictionary-type, anti-slop/no-conditional-empty-object-spread, anti-slop/require-readable-spacing */

import type { JsonRpcError, JsonRpcRequest } from "./json-rpc.ts";

export type ParsedJsonRpcRequest =
  | { ok: true; request: JsonRpcRequest }
  | { ok: false; error: JsonRpcError };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRequestId(value: unknown): value is string | number {
  return (
    (typeof value === "string" && value.length > 0) ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

export function isJsonRpcNotification(input: unknown): boolean {
  return (
    isRecord(input) &&
    input.jsonrpc === "2.0" &&
    typeof input.method === "string" &&
    input.method.length > 0 &&
    !("id" in input)
  );
}

export function parseJsonRpcRequest(input: unknown): ParsedJsonRpcRequest {
  if (!isRecord(input)) return invalidRequest("Request must be an object");
  if (input.jsonrpc !== "2.0") {
    return invalidRequest('jsonrpc must be "2.0"');
  }

  if (!isRequestId(input.id)) return invalidRequest("id must be a string or number");

  if (typeof input.method !== "string" || input.method.length === 0) {
    return invalidRequest("method must be a non-empty string");
  }

  return {
    ok: true,
    request: {
      jsonrpc: "2.0",
      id: input.id,
      method: input.method,
      ...(input.params === undefined ? {} : { params: input.params }),
    },
  };
}

function invalidRequest(message: string): ParsedJsonRpcRequest {
  return {
    ok: false,
    error: { code: -32600, message },
  };
}
