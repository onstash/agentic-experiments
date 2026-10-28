# Repository memory

This file indexes agent-specific memory.

No active agents exist yet. Add one link for each `agents/<agent-name>/MEMORY.md` file.

## 2026-10-28 — Treat Life OS identity mapping as an MCP contract

Total Recall must not assume that a Google OAuth subject is the same value as
Life OS's internal `user.id`. Life OS uses the Google subject for memory
ownership but uses the internal user ID for notes, tasks, and projects.

When changing MCP retrieval or the Life OS client boundary:

- preserve the `search` → `execute` contract;
- keep record retrieval operations in `execute`;
- run `pnpm --filter life-os-web check:agent-identity` in Life OS and
  `pnpm --filter ./agents/total-recall run check:agent-contract` in Total Recall;
- do not interpret an empty result as proof of an empty workspace until the
  identity and database contract checks pass.

## 2026-10-28 — Treat capability discovery and execution as one contract

The MCP must document and enforce the operation envelope: every operation has
an `id` and an `input` object. Do not expose `any[]`, accept `args`, or rely on
agents guessing backend fields. Life OS capability discovery must publish the
operation-specific `inputSchema`, and Total Recall must preserve it. Run
`pnpm --filter ./agents/total-recall run check:mcp-contract` when changing the
MCP tool or Life OS client contract.
