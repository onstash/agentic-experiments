---
name: merge-and-rebase
description: Merge an authorized verified pull request and return the checkout to a clean updated base branch.
---

# Merge and rebase

Merge only after the user authorizes it and required checks pass.

## Required proof

- PR URL and head SHA.
- All required checks passed.
- No unresolved review or conflict state.
- Merge commit or squash commit SHA.
- Base branch checked out and updated from its upstream.
- Final tracked worktree status.

Never use destructive reset or clean commands to manufacture a clean state.
