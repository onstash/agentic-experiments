---
name: implement-and-verify
description: Implement a focused change and prove it with the smallest relevant repository checks.
---

# Implement and verify

Read the applicable repository instructions and relevant files before editing.

## Required sequence

1. State the changed behavior and non-goals.
2. Make the smallest focused edit.
3. Run format check.
4. Run lint and typecheck when configured.
5. Run focused tests, then the repository gate when the change is high risk.
6. Run `git diff --check`.
7. Record exact commands and results.

Failure output must include the command, exit status, relevant diagnostic, and next action.
