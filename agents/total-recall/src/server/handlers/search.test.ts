import assert from "node:assert/strict";
import test from "node:test";

import type { LifeOsClient } from "../../life-os/client.ts";
import { createSearchHandler } from "./search.ts";

test("search forwards parsed capability queries to Life OS", async () => {
  let received: { query?: string; limit?: number } | undefined;

  const client = {
    async searchCapabilities(input) {
      received = input;

      return {
        capabilities: [
          { id: "notes.search", description: "Search notes", policy: "read", resultLimit: 50 },
        ],
      };
    },
    async execute() {
      return {};
    },

    async proposeMemory() {
      throw new Error("unused");
    },
    async getProposal() {
      throw new Error("unused");
    },
  } satisfies LifeOsClient;

  const result = await createSearchHandler(client)({ query: "notes", limit: 5 });

  assert.deepEqual(received, { query: "notes", limit: 5 });
  assert.equal(result.isError, undefined);
  assert.match(result.content[0]?.text ?? "", /notes.search/);
});

test("search rejects invalid arguments before calling Life OS", async () => {
  let called = false;

  const client = {
    async searchCapabilities() {
      called = true;

      return { capabilities: [] };
    },
    async execute() {
      return {};
    },
    async proposeMemory() {
      throw new Error("unused");
    },
    async getProposal() {
      throw new Error("unused");
    },
  } satisfies LifeOsClient;

  const result = await createSearchHandler(client)({ limit: 0 });

  assert.equal(called, false);
  assert.equal(result.isError, true);
});

test("search applies the default limit", async () => {
  let received: { query: string; limit: number } | undefined;

  const client = {
    async searchCapabilities(input: { query: string; limit: number }) {
      received = input;

      return { capabilities: [] };
    },
    async execute() {
      return {};
    },
    async proposeMemory() {
      throw new Error("unused");
    },
    async getProposal() {
      throw new Error("unused");
    },
  } satisfies LifeOsClient;

  const result = await createSearchHandler(client)({ query: "tasks" });

  assert.deepEqual(received, { query: "tasks", limit: 20 });
  assert.equal(result.isError, undefined);
});
