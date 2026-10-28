import assert from "node:assert/strict";
import test from "node:test";

import { parseJsonRpcRequest, parseToolsCallRequest } from "../protocol/parse.ts";
import type { JsonValue } from "../protocol/tools.ts";
import { createHttpHandler } from "./http.ts";

const jsonHeaders = {
  "Content-Type": "application/json",
  Authorization: "Bearer test-token",
};

const handleHttpRequest = createHttpHandler({
  authenticate: async (token) => (token === "test-token" ? new Set() : null),
});

test("rejects non-POST requests", async () => {
  const response = await handleHttpRequest(new Request("http://localhost/mcp"));

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "POST");
});

test("rejects missing authorization", async () => {
  const response = await handleHttpRequest(
    new Request("http://localhost/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }),
  );

  assert.equal(response.status, 401);
});

test("rejects invalid authorization", async () => {
  const response = await handleHttpRequest(
    new Request("http://localhost/mcp", {
      method: "POST",
      headers: { ...jsonHeaders, Authorization: "Bearer wrong-token" },
      body: "{}",
    }),
  );

  assert.equal(response.status, 401);
});

test("rejects unsupported content types after authorization", async () => {
  const response = await handleHttpRequest(
    new Request("http://localhost/mcp", {
      method: "POST",
      headers: { Authorization: "Bearer test-token", "Content-Type": "text/plain" },
      body: "{}",
    }),
  );

  assert.equal(response.status, 415);
});

test("returns parse errors for invalid JSON", async () => {
  const response = await handleHttpRequest(
    new Request("http://localhost/mcp", {
      method: "POST",
      headers: jsonHeaders,
      body: "not-json",
    }),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    jsonrpc: "2.0",
    id: null,
    error: { code: -32700, message: "Parse error" },
  });
});

test("accepts MCP notifications without a JSON-RPC response", async () => {
  const response = await handleHttpRequest(
    new Request("http://localhost/mcp", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      }),
    }),
  );

  assert.equal(response.status, 202);
  assert.equal(await response.text(), "");
});

test("rejects tool calls without their required scope", async () => {
  const handler = createHttpHandler({
    authenticate: async () => new Set(["total-recall.memory.propose"]),
    requiredScopes: (input) =>
      isMemoryGetProposalCall(input) ? ["total-recall.memory.get_proposal"] : [],
    resourceMetadataUrl: "https://total-recall.test/.well-known/oauth-protected-resource/mcp",
  });

  const response = await handler(
    new Request("http://localhost/mcp", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "memory.get_proposal" },
      }),
    }),
  );

  assert.equal(response.status, 403);
  assert.match(response.headers.get("WWW-Authenticate") ?? "", /insufficient_scope/);
});

test("routes valid MCP messages", async () => {
  const response = await handleHttpRequest(
    new Request("http://localhost/mcp", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
      }),
    }),
  );

  assert.equal(response.status, 200);
  const body = await response.json();

  assert.equal(body.jsonrpc, "2.0");
  assert.equal(body.id, 1);
  assert.equal(body.result.tools[0].name, "search");
  assert.equal(response.headers.get("Content-Type"), "application/json");
});

function isMemoryGetProposalCall(input: JsonValue): boolean {
  const parsed = parseJsonRpcRequest(input);

  if (!parsed.ok || parsed.request.method !== "tools/call") return false;

  return parseToolsCallRequest(parsed.request.params)?.name === "memory.get_proposal";
}
