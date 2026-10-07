# pi-checklist

A session-scoped checklist extension for Pi.

## Development

From the monorepo root:

```sh
pnpm install
pnpm exec oxfmt --check pi-extensions/pi-checklist/src pi-extensions/pi-checklist/*.json
pnpm exec oxlint pi-extensions/pi-checklist/src
pnpm --filter pi-checklist test
```

Load the built extension during development:

```sh
pi --extension ./pi-extensions/pi-checklist/dist/index.js
```

## Tools

- `checklist_create` replaces the current checklist and creates up to five tasks.
- `checklist_read` shows task status and dependency readiness.
- `checklist_update` atomically changes task status, title, or dependencies.

Only one task may be `ongoing`. Tasks cannot start while dependencies are incomplete.
Task state is persisted as versioned events in the Pi session and replayed when the
session resumes or changes branch.

## Command and widget

`/checklist` shows the current checklist. `/checklist clear` clears it.

When tasks exist, a compact widget shows completion, the ongoing task, and blocked
dependencies. The widget is intentionally read-only; mutations go through the tools.

