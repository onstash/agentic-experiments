import assert from "node:assert/strict";
import test from "node:test";

import worker, { type Env } from "./worker.ts";

const env: Env = {
  TOTAL_RECALL_TOKEN: "test-token",
  LIFE_OS_BASE_URL: "https://life-os.example",
  LIFE_OS_SERVICE_TOKEN: "life-os-service-token",
};

const integratedEnv: Env = {
  ...env,
  LIFE_OS: {
    async fetch(input) {
      const url = input instanceof Request ? input.url : input.toString();

      if (url.endsWith("/api/private/agent/capabilities")) {
        return Response.json({
          capabilities: [
            {
              id: "memory.search",
              description: "Search memory",
              policy: "read",
              resultLimit: 20,
              inputSchema: { type: "object", properties: { query: { type: "string" } } },
            },
          ],
        });
      }

      return Response.json({
        mode: "preview",
        results: [{ id: "memory.propose", result: { proposalId: "proposal-1" } }],
      });
    },
  },
};

function request(token: string): Request {
  return new Request("https://total-recall.test/mcp", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
    }),
  });
}

test("authenticates requests with the Worker environment token", async () => {
  const response = await worker.fetch(request("test-token"), env);

  assert.equal(response.status, 200);
});

test("rejects requests with the wrong Worker environment token", async () => {
  const response = await worker.fetch(request("wrong-token"), env);

  assert.equal(response.status, 401);
});

test("publishes OAuth protected-resource metadata", async () => {
  const response = await worker.fetch(
    new Request("https://total-recall.test/.well-known/oauth-protected-resource/mcp"),
    env,
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "public, max-age=300");
  assert.deepEqual(await response.json(), {
    resource: "https://total-recall.hastons.workers.dev/mcp",
    authorization_servers: ["https://life-os.example/api/auth"],
    scopes_supported: ["total-recall.search", "total-recall.execute"],
    bearer_methods_supported: ["header"],
  });
});

test("serves MCP only from /mcp", async () => {
  const rootRequest = new Request("https://total-recall.test", {
    method: "POST",
  });

  const response = await worker.fetch(rootRequest, env);

  assert.equal(response.status, 404);
});

test("runs search through the Worker and Life OS binding", async () => {
  const response = await worker.fetch(
    new Request("https://total-recall.test/mcp", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "search", arguments: { query: "memory" } },
      }),
    }),
    integratedEnv,
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.result.content[0].text.includes("memory.search"), true);
});

test("runs execute through the Worker and Life OS binding", async () => {
  const response = await worker.fetch(
    new Request("https://total-recall.test/mcp", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "execute",
          arguments: {
            operations: [{ id: "memory.propose", input: {} }],
            mode: "preview",
            idempotencyKey: "request-1",
          },
        },
      }),
    }),
    integratedEnv,
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.result.structuredContent.results[0].id, "memory.propose");
});
