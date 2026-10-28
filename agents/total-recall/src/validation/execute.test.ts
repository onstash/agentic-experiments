import assert from "node:assert/strict";
import test from "node:test";

import { parseExecuteArguments } from "./execute.ts";

test("accepts a bounded preview execution", () => {
  const result = parseExecuteArguments({
    operations: [{ id: "memory.search", input: { query: "work" } }],
    mode: "preview",
    idempotencyKey: "request-1",
  });

  assert.ok("value" in result);
  assert.equal(result.value.mode, "preview");
  assert.equal(result.value.operations[0]?.id, "memory.search");
});

test("rejects execution without an idempotency key", () => {
  const result = parseExecuteArguments({
    operations: [{ id: "memory.search", input: {} }],
    mode: "preview",
  });

  assert.ok("error" in result);

  assert.equal(result.error.code, "INVALID_OPERATION_INPUT");

  assert.equal(result.error.path, "execute.idempotencyKey");
});

test("rejects an empty operation batch", () => {
  const result = parseExecuteArguments({
    operations: [],
    mode: "commit",
    idempotencyKey: "request-1",
  });

  assert.ok("error" in result);
});

test("rejects args instead of silently accepting the wrong operation envelope", () => {
  const result = parseExecuteArguments({
    operations: [{ id: "notes.get", args: { id: "note-1" }, input: {} }],
    mode: "preview",
    idempotencyKey: "request-1",
  });

  assert.ok("error" in result);
  assert.equal(result.error.code, "INVALID_OPERATION_INPUT");
});

test("reports a missing operation input path", () => {
  const result = parseExecuteArguments({
    operations: [{ id: "notes.get" }],
    mode: "preview",
    idempotencyKey: "request-1",
  });

  assert.ok("error" in result);
  assert.equal(result.error.path, "operations[0].input");
});
