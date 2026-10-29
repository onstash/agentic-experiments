---
name: babysit-pr
description: Monitor a pull request until checks, conflicts, and review state are known.
---

# Babysit a pull request

Use the provider's watcher when available. Do not invent a passing state from a stale local
checkout.

## Check

- Required checks and their current commit.
- Mergeability and conflicts.
- Review comments and requested changes.
- Deployment or release checks when they are part of the repository adapter.

If a check fails, capture the job URL and failure summary before changing code. Unwatch the PR
before handing monitoring back to the user.
