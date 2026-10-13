import assert from "node:assert/strict";
import test from "node:test";

import { parseJsonRpcRequest } from "./parse.ts";

test("parses a valid JSON-RPC request", () => {
  const parsed = parseJsonRpcRequest({
    jsonrpc: "2.0",
    id: "request-1",
    method: "tools/list",
    params: {},
  });

  assert.equal(parsed.ok, true);

  if (parsed.ok) assert.equal(parsed.request.method, "tools/list");
});

test("rejects non-object input", () => {
  const parsed = parseJsonRpcRequest(null);

  assert.equal(parsed.ok, false);

  if (!parsed.ok) assert.equal(parsed.error.code, -32600);
});

test("rejects an unsupported JSON-RPC version", () => {
  const parsed = parseJsonRpcRequest({
    jsonrpc: "1.0",
    id: 1,
    method: "tools/list",
  });

  assert.equal(parsed.ok, false);
});

test("rejects missing or invalid request fields", () => {
  for (const input of [
    { jsonrpc: "2.0", method: "tools/list" },
    { jsonrpc: "2.0", id: null, method: "tools/list" },
    { jsonrpc: "2.0", id: 1, method: "" },
  ]) {
    const parsed = parseJsonRpcRequest(input);

    assert.equal(parsed.ok, false);
  }
});
