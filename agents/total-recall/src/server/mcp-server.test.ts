import assert from "node:assert/strict";
import test from "node:test";

import { handleMessage, handleRequest } from "./mcp-server.ts";

test("rejects malformed input at the server boundary", async () => {
  const response = await handleMessage({
    jsonrpc: "1.0",
    id: 1,
    method: "tools/list",
  });

  assert.equal(response.id, null);
  assert.ok("error" in response);
  assert.ok(response.error);
  assert.equal(response.error.code, -32600);
});

test("returns the MCP initialize handshake", async () => {
  const response = await handleMessage({
    jsonrpc: "2.0",
    id: 0,
    method: "initialize",
    params: {
      protocolVersion: "2026-07-28",
      capabilities: {},
      clientInfo: { name: "test-client", version: "0.1.0" },
    },
  });

  assert.ok("result" in response);
  assert.ok(response.result);
  assert.ok("protocolVersion" in response.result);
  assert.equal(response.result.protocolVersion, "2026-07-28");
  assert.equal(response.result.serverInfo.name, "total-recall");
  assert.ok("tools" in response.result.capabilities);
});

test("routes valid server-boundary messages", async () => {
  const response = await handleMessage({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
  });

  assert.ok("result" in response);
  assert.ok(response.result);
  assert.ok("tools" in response.result);
  assert.equal(response.result.tools[0].name, "memory.propose");
});

test("lists registered tools", async () => {
  const response = await handleRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
  });

  assert.equal(response.id, 1);
  assert.ok("result" in response);
  assert.ok(response.result);
  assert.ok("tools" in response.result);
  assert.equal(response.result.tools[0].name, "memory.propose");
  assert.equal(
    response.result.tools.some((tool) => tool.name === "memory.decide_proposal"),
    false,
  );
});

test("routes tools/call to the dispatcher", async () => {
  const response = await handleRequest({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "memory.propose",
      arguments: {
        items: [
          {
            kind: "preference",
            content: "The user lives in London.",
            scope: { type: "global" },
          },
        ],
        idempotencyKey: "request-1",
      },
    },
  });

  assert.equal(response.id, 2);
  assert.ok("result" in response);
  assert.ok(response.result);
  assert.ok("structuredContent" in response.result);
  assert.equal(response.result.structuredContent?.status, "pending");
});

test("returns invalid params for malformed tools/call params", async () => {
  const response = await handleRequest({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { arguments: {} },
  });

  assert.ok("error" in response);
  assert.ok(response.error);
  assert.equal(response.error.code, -32602);
});

test("returns method not found for unknown methods", async () => {
  const response = await handleRequest({
    jsonrpc: "2.0",
    id: 4,
    method: "resources/list",
  });

  assert.ok("error" in response);
  assert.ok(response.error);
  assert.equal(response.error.code, -32601);
});
