import assert from "node:assert/strict";
import test from "node:test";

import { validateMemoryProposal } from "./memory-propose.ts";

test("accepts a Life OS-compatible global memory", () => {
  const result = validateMemoryProposal({
    items: [
      {
        content: "Prefer concise explanations.",
        kind: "preference",
        scope: { type: "global" },
      },
    ],
    idempotencyKey: "request-1",
  });

  assert.deepEqual(result, { valid: true });
});

test("accepts a project memory with an id", () => {
  const result = validateMemoryProposal({
    items: [
      {
        content: "Run tests before committing.",
        kind: "rule",
        scope: { id: "life-os", type: "project" },
      },
    ],
    idempotencyKey: "request-2",
  });

  assert.deepEqual(result, { valid: true });
});

test("rejects the retired class and fact fields", () => {
  const result = validateMemoryProposal({
    items: [
      {
        class: "semantic",
        content: "The user lives in London.",
        kind: "fact",
        scope: { type: "global" },
      },
    ],
    idempotencyKey: "request-3",
  });

  assert.equal(result.valid, false);
});

test("rejects a project scope without an id", () => {
  const result = validateMemoryProposal({
    items: [
      {
        content: "Invalid scope.",
        kind: "project_context",
        scope: { type: "project" },
      },
    ],
    idempotencyKey: "request-4",
  });

  assert.equal(result.valid, false);
});
