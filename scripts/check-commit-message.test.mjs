import assert from "node:assert/strict";
import test from "node:test";

import { validateCommitMessage } from "./check-commit-message.mjs";

test("accepts real multiline commit bodies", () => {
  assert.equal(validateCommitMessage("fix: example\n\n- one\n- two"), null);
});

test("rejects literal escaped newlines", () => {
  assert.match(validateCommitMessage(String.raw`fix: example\\n- one`), /literal/);
});
