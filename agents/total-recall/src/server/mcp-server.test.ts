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
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "test-client", version: "0.1.0" },
    },
  });

  assert.ok("result" in response);
  assert.ok(response.result);
  assert.ok("protocolVersion" in response.result);
  assert.equal(response.result.protocolVersion, "2025-06-18");
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
  assert.equal(response.result.tools[0].name, "search");
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
  assert.equal(response.result.tools[0].name, "search");
  assert.equal(response.result.tools[1].name, "execute");
  assert.match(response.result.tools[0].description, /does not return Life OS records/);
  assert.match(
    response.result.tools[1].description,
    /return records, analysis, or proposal results/,
  );
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
      name: "execute",
      arguments: { operations: [], mode: "preview", idempotencyKey: "request-1" },
    },
  });

  assert.equal(response.id, 2);
  assert.ok("result" in response);
  assert.ok(response.result);
  assert.equal(response.result.isError, true);
});

test("passes search calls to the supplied dispatcher", async () => {
  let receivedName = "";

  const response = await handleRequest(
    {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "search", arguments: { query: "notes", limit: 5 } },
    },
    async (request) => {
      receivedName = request.name;

      return { content: [{ type: "text", text: "search result" }] };
    },
  );

  assert.equal(receivedName, "search");
  assert.equal(response.id, 3);
  assert.ok("result" in response);
  assert.equal(response.result.content[0]?.text, "search result");
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
