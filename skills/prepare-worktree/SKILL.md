---
name: prepare-worktree
description: Prepare a repository worktree safely before implementation, preserving unrelated changes.
---

# Prepare a worktree

Inspect `git status --short --branch`, current branch, upstream, and the target base branch.

## Rules

- Preserve unrelated tracked and untracked changes.
- Do not reset, clean, checkout-overwrite, or delete user data.
- Update the base branch with fetch and rebase only when authorized.
- Create a descriptive branch from the intended base.
- Record the starting commit and dirty paths in the report.
- If tracked edits overlap the requested files, stop and report the conflict.

The output is a prepared branch plus an auditable starting-state summary.
