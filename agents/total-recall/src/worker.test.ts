import assert from "node:assert/strict";
import test from "node:test";

import worker, { type Env } from "./worker.ts";

const env: Env = {
  TOTAL_RECALL_TOKEN: "test-token",
  LIFE_OS_BASE_URL: "https://life-os.example",
  LIFE_OS_SERVICE_TOKEN: "life-os-service-token",
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
    scopes_supported: ["total-recall.memory.propose", "total-recall.memory.get_proposal"],
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
