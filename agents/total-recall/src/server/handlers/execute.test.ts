import assert from "node:assert/strict";
import test from "node:test";

import type { LifeOsClient } from "../../life-os/client.ts";
import { createExecuteHandler } from "./execute.ts";

test("execute forwards a parsed preview batch to Life OS", async () => {
  let received: Parameters<LifeOsClient["execute"]>[0] | undefined;

  const client = {
    async searchCapabilities() {
      return { capabilities: [] };
    },

    async execute(input) {
      received = input;

      return { proposalId: "proposal-1", status: "pending" };
    },

    async proposeMemory() {
      throw new Error("unused");
    },

    async getProposal() {
      throw new Error("unused");
    },
  } satisfies LifeOsClient;

  const result = await createExecuteHandler(client)({
    operations: [{ id: "memory.search", input: { query: "work" } }],
    mode: "preview",
    idempotencyKey: "request-1",
  });

  assert.deepEqual(received, {
    operations: [{ id: "memory.search", input: { query: "work" } }],
    mode: "preview",
    idempotencyKey: "request-1",
  });
  assert.equal(result.isError, undefined);
  assert.match(result.content[0]?.text ?? "", /proposal-1/);
});

test("execute rejects invalid arguments before calling Life OS", async () => {
  let called = false;

  const client = {
    async searchCapabilities() {
      return { capabilities: [] };
    },

    async execute() {
      called = true;

      return {};
    },

    async proposeMemory() {
      throw new Error("unused");
    },

    async getProposal() {
      throw new Error("unused");
    },
  } satisfies LifeOsClient;

  const result = await createExecuteHandler(client)({ mode: "commit", operations: [] });

  assert.equal(called, false);
  assert.equal(result.isError, true);
});

test("execute returns structured Life OS failures to the MCP boundary", async () => {
  const client = {
    async searchCapabilities() {
      return { capabilities: [] };
    },
    async execute() {
      const { LifeOsApiError } = await import("../../life-os/http-client.ts");

      throw new LifeOsApiError(
        500,
        "Life OS unavailable",
        "https://life-os.test/api/private/agent/execute",
        JSON.stringify({
          code: "PROPOSAL_PERSISTENCE_FAILED",
          error: "Unable to create memory proposal.",
          retryable: true,
        }),
      );
    },
    async proposeMemory() {
      throw new Error("unused");
    },
    async getProposal() {
      throw new Error("unused");
    },
  } satisfies LifeOsClient;

  const result = await createExecuteHandler(client)({
    operations: [{ id: "memory.search", input: { query: "work" } }],
    mode: "commit",
    idempotencyKey: "failure-test",
  });

  assert.equal(result.isError, true);
  assert.deepEqual(result.structuredContent, {
    code: "LIFE_OS_EXECUTION_FAILED",
    message: JSON.stringify({
      code: "PROPOSAL_PERSISTENCE_FAILED",
      error: "Unable to create memory proposal.",
      retryable: true,
    }),
    retryable: false,
    status: 500,
  });
});
