import assert from "node:assert/strict";
import test from "node:test";

import worker, { type Env } from "./worker.ts";

const env: Env = {
  TOTAL_RECALL_TOKEN: "test-token",
  LIFE_OS_BASE_URL: "https://life-os.example",
  LIFE_OS_TOKEN: "life-os-token",
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
