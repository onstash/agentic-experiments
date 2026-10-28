import assert from "node:assert/strict";
import test from "node:test";

import type { MemoryProposalResult } from "../domain/memory.ts";
import { createLifeOsHttpClient, LifeOsApiError } from "./http-client.ts";

test("posts proposals to Life OS with private auth and idempotency", async () => {
  let receivedUrl: URL | undefined;

  let receivedInit: RequestInit | undefined;

  const responseBody: MemoryProposalResult = {
    proposalId: "proposal-1",
    status: "pending",
    message: "Review this proposal in Life OS.",
    archiveAt: "2026-11-01T00:00:00.000Z",
  };

  const client = createLifeOsHttpClient({
    baseUrl: "https://life-os.example/",
    token: "private-token",
    fetch: async (input, init) => {
      receivedUrl = new URL(input.toString());
      receivedInit = init;

      return new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  const result = await client.proposeMemory({
    items: [],
    idempotencyKey: "request-1",
  });

  assert.equal(receivedUrl?.pathname, "/api/private/memory/proposals");
  assert.equal(receivedInit?.method, "POST");
  assert.equal(new Headers(receivedInit?.headers).get("Authorization"), "Bearer private-token");
  assert.equal(new Headers(receivedInit?.headers).get("X-Idempotency-Key"), "request-1");
  assert.deepEqual(JSON.parse(String(receivedInit?.body)), {
    items: [],
    idempotencyKey: "request-1",
  });
  assert.deepEqual(result, responseBody);
});

test("raises a typed error for Life OS failures", async () => {
  const client = createLifeOsHttpClient({
    baseUrl: "https://life-os.example",
    token: "private-token",
    fetch: async () => new Response(null, { status: 401 }),
  });

  await assert.rejects(
    client.proposeMemory({ items: [], idempotencyKey: "request-2" }),
    (error) => {
      assert.ok(error instanceof LifeOsApiError);

      assert.equal(error.status, 401);

      return true;
    },
  );
});
