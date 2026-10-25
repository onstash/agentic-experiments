import assert from "node:assert/strict";
import test from "node:test";

import { createHttpHandler } from "./http.ts";

const jsonHeaders = {
  "Content-Type": "application/json",
  Authorization: "Bearer test-token",
};

const handleHttpRequest = createHttpHandler({
  authenticate: async (token) => token === "test-token",
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
  assert.equal(body.result.tools[0].name, "memory.propose");
  assert.equal(response.headers.get("Content-Type"), "application/json");
});
