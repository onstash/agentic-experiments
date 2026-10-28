import assert from "node:assert/strict";
import test from "node:test";

import { parseExecuteArguments } from "./execute.ts";

test("accepts a bounded preview execution", () => {
  const result = parseExecuteArguments({
    operations: [{ id: "memory.search", input: { query: "work" } }],
    mode: "preview",
    idempotencyKey: "request-1",
  });

  assert.ok(result);
  assert.equal(result.mode, "preview");
  assert.equal(result.operations[0]?.id, "memory.search");
});

test("rejects execution without an idempotency key", () => {
  const result = parseExecuteArguments({
    operations: [{ id: "memory.search" }],
    mode: "preview",
  });

  assert.equal(result, null);
});

test("rejects an empty operation batch", () => {
  const result = parseExecuteArguments({
    operations: [],
    mode: "commit",
    idempotencyKey: "request-1",
  });

  assert.equal(result, null);
});
