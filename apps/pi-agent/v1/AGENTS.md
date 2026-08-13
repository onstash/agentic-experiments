# AGENTS.md

## Scope

This instruction applies to all work inside `apps/pi-agent/`.

## Language

Write new and changed documentation in Simplified Technical English. Use short
sentences, active voice, and one clear meaning for each term. Keep code,
identifiers, commands, file paths, and quoted errors unchanged.

Use Simplified Technical English for writing guidance.

## Repository boundary

- Use only code, configuration, fixtures, and dependencies owned by `apps/pi-agent/`.
- Do not read from, import from, modify, or depend on `apps/typescript-agent/`.
- Do not move implementation from another app into this package by using relative imports.
- If functionality is missing, implement the required local version inside `apps/pi-agent/`.
- Keep tests, evals, schemas, and fixtures inside `apps/pi-agent/`.

## Verification

Run commands from `apps/pi-agent/` and verify at minimum:

```bash
pnpm check
pnpm test
pnpm eval
```

Do not change files outside `apps/pi-agent/` unless the user explicitly requests it.

## Release documentation

The package version is `0.4.0` in [package.json](./package.json).

Record release history in [CHANGELOG.md](./CHANGELOG.md).

Create a Changeset from the repository root before a release:

```bash
pnpm changeset
```

Apply pending Changesets from the repository root:

```bash
pnpm version-packages
```

Review the package version and changelog after the version command. Run the
verification commands before you commit the release files.
