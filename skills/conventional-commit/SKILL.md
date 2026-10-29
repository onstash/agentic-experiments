---
name: conventional-commit
description: Write and validate a Conventional Commit while applying the user's repository and body-format preferences.
---

# Conventional Commit

Use the Conventional Commits structure required by Release Please and commitlint:

```text
type(scope): description

body
```

Personal preferences are an additional policy layer:

- Keep the subject concise and intent-focused.
- Include a body for medium or large diffs.
- Use Markdown bullet points with real line breaks.
- Do not include generated noise or unsupported claims.
- Match the repository's release and validation rules.

The skill writes the message; `scripts/verify-commit-message.mjs` checks the bytes.
