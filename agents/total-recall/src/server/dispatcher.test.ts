/* Runtime type assertion is the test's subject, not production parsing. */
/* oxlint-disable anti-slop/no-runtime-typeof */

import assert from "node:assert/strict";
import test from "node:test";

import { callTool } from "./dispatcher.ts";

test("returns a tool error for an unknown tool", async () => {
  const result = await callTool({ name: "memory.unknown", arguments: {} });

  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /Unknown tool/);
});

test("rejects invalid memory proposal arguments before handling", async () => {
  const result = await callTool({
    name: "memory.propose",
    arguments: {
      items: [
        {
          kind: "fact",
          content: "Invalid classification.",
          scope: { type: "global" },
        },
      ],
      idempotencyKey: "request-invalid",
    },
  });

  assert.equal(result.isError, true);
  assert.equal(result.structuredContent?.status, "invalid_arguments");
  assert.ok(Array.isArray(result.structuredContent?.errors));
});

test("dispatches valid memory proposals to the handler", async () => {
  const result = await callTool({
    name: "memory.propose",
    arguments: {
      items: [
        {
          kind: "preference",
          content: "Prefer concise explanations.",
          scope: { type: "global" },
        },
      ],
      idempotencyKey: "request-valid",
    },
  });

  assert.equal(result.isError, undefined);
  assert.ok(result.structuredContent);
  assert.equal(result.structuredContent.status, "pending");
  assert.equal(typeof result.structuredContent.proposalId, "string");
});

test("rejects missing arguments", async () => {
  const result = await callTool({ name: "memory.propose" });

  assert.equal(result.isError, true);
});
