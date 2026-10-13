import assert from "node:assert/strict";
import test from "node:test";

import { validateMemoryProposal } from "./memory-propose.ts";

test("accepts valid semantic memory", () => {
  const result = validateMemoryProposal({
    items: [
      {
        class: "semantic",
        kind: "fact",
        content: "The user lives in London.",
        scope: { type: "global" },
      },
    ],
    idempotencyKey: "request-1",
  });

  assert.deepEqual(result, { valid: true });
});

test("accepts valid procedural project memory", () => {
  const result = validateMemoryProposal({
    items: [
      {
        class: "procedural",
        kind: "rule",
        content: "Run tests before committing.",
        scope: { type: "project", projectId: "life-os" },
      },
    ],
    idempotencyKey: "request-2",
  });

  assert.deepEqual(result, { valid: true });
});

test("rejects mismatched class and kind", () => {
  const result = validateMemoryProposal({
    items: [
      {
        class: "procedural",
        kind: "fact",
        content: "Invalid classification.",
        scope: { type: "global" },
      },
    ],
    idempotencyKey: "request-3",
  });

  assert.equal(result.valid, false);
});

test("rejects a project scope without projectId", () => {
  const result = validateMemoryProposal({
    items: [
      {
        class: "semantic",
        kind: "project_context",
        content: "Invalid scope.",
        scope: { type: "project" },
      },
    ],
    idempotencyKey: "request-4",
  });

  assert.equal(result.valid, false);
});
