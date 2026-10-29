---
name: ship-change-safely
description: Coordinate a verified code change from worktree preparation through PR merge and final branch cleanup.
---

# Ship a change safely

Use this as the default coordinator for a code change.

## Workflow

1. Run `prepare-worktree`.
2. Confirm the requested scope, base branch, and repository adapter.
3. Implement the smallest change that satisfies the request.
4. Run `implement-and-verify`.
5. Run `commit-safely`.
6. Run `create-or-update-pr`.
7. Run `babysit-pr` until checks and review state are known.
8. Run `merge-and-rebase` only when the user has authorized the merge.
9. Report commands, checks, commit, PR, merge, and remaining uncertainty.

Do not claim deployment, merge, or verification without command or provider evidence.

## Repository boundary

The workflow is portable. Repository adapters supply package commands, protected branches,
deployment checks, and provider-specific policy. Never hard-code Life OS or Total Recall paths
in this skill.
