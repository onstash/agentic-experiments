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

test("execute preserves Life OS failures for the MCP boundary", async () => {
  const client = {
    async searchCapabilities() {
      return { capabilities: [] };
    },
    async execute() {
      throw new Error("Life OS unavailable");
    },
    async proposeMemory() {
      throw new Error("unused");
    },
    async getProposal() {
      throw new Error("unused");
    },
  } satisfies LifeOsClient;

  await assert.rejects(
    createExecuteHandler(client)({
      operations: [{ id: "memory.search", input: { query: "work" } }],
      mode: "commit",
      idempotencyKey: "failure-test",
    }),
    /Life OS unavailable/,
  );
});
