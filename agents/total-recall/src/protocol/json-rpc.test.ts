import type { JsonRpcError, JsonRpcRequest, JsonRpcResponse } from "./json-rpc.js";

const request: JsonRpcRequest = {
  jsonrpc: "2.0",
  id: "request-1",
  method: "tools/list",
};

const success: JsonRpcResponse<{ tools: unknown[] }> = {
  jsonrpc: "2.0",
  id: request.id,
  result: { tools: [] },
};

const error: JsonRpcResponse<never> = {
  jsonrpc: "2.0",
  id: null,
  error: {
    code: -32600,
    message: "Invalid Request",
    data: { reason: "Malformed JSON-RPC request" },
  },
};

void success;

void error;

// @ts-expect-error A response cannot contain both result and error.
const invalidBoth: JsonRpcResponse<unknown> = {
  jsonrpc: "2.0",
  id: 1,
  result: {},
  error: { code: -32600, message: "Invalid Request" },
};

// @ts-expect-error A response must contain either result or error.
const invalidNeither: JsonRpcResponse<unknown> = {
  jsonrpc: "2.0",
  id: 1,
};

// @ts-expect-error A request requires a method.
const invalidRequest: JsonRpcRequest = {
  jsonrpc: "2.0",
  id: 1,
};

const protocolError: JsonRpcError = {
  code: -32601,
  message: "Method not found",
};

void invalidBoth;

void invalidNeither;

void invalidRequest;

void protocolError;
