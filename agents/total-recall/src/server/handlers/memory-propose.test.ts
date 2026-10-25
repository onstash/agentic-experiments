import assert from "node:assert/strict";
import test from "node:test";

import type { MemoryProposalInput, MemoryProposalResult } from "../../domain/memory.ts";
import type { LifeOsClient } from "../../life-os/client.ts";
import { createMemoryProposeHandler } from "./memory-propose.ts";

test("forwards validated proposals to the Life OS client", async () => {
  let received: MemoryProposalInput | undefined;

  const client: LifeOsClient = {
    async proposeMemory(input) {
      received = input;

      return pendingResult;
    },
  };

  const result = await createMemoryProposeHandler(client)({
    items: [],
    idempotencyKey: "request-1",
  });

  assert.deepEqual(received, {
    items: [],
    idempotencyKey: "request-1",
  });
  assert.equal(result.structuredContent?.proposalId, "proposal-1");
});

const pendingResult: MemoryProposalResult = {
  proposalId: "proposal-1",
  status: "pending",
  message: "Review this proposal in Life OS.",
  archiveAt: "2026-11-01T00:00:00.000Z",
};
