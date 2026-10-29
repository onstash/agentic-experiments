---
name: commit-safely
description: Create a valid, reviewable Conventional Commit with a truthful body and reproducible proof.
---

# Commit safely

Review the staged diff before committing. Use the repository's Conventional Commits validator
and the `conventional-commit` skill when available.

## Rules

- Stage only the requested files.
- Use a truthful `type(scope): description` subject.
- Add a body only when the diff is medium or large, or the user requests one.
- Use real line breaks in the body. Never pass literal `\\n` text.
- Use separate `-m` arguments, a heredoc, or a body file.
- Run the commit-message check against the resulting commit message.
- Report the commit SHA and exact message.
