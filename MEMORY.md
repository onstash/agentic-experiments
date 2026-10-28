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
