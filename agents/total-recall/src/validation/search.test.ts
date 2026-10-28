import assert from "node:assert/strict";
import test from "node:test";

import { parseSearchArguments } from "./search.ts";

test("accepts bounded search arguments", () => {
  const result = parseSearchArguments({ query: "notes", limit: 10 });

  assert.equal(result.valid, true);

  if (result.valid) assert.deepEqual(result.value, { query: "notes", limit: 10 });
});

test("rejects invalid search arguments", () => {
  const result = parseSearchArguments({ limit: 0 });
  assert.equal(result.valid, false);
});
