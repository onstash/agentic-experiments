# Repository instructions

## Scope

This file applies to the full repository. A deeper `AGENTS.md` file can add rules for one agent or package.

## Agent boundaries

- Put each agent in `agents/<agent-name>/`.
- Keep each agent independent and complete.
- Do not read from, import from, or modify another agent unless the user names it.
- Keep an agent's tests, fixtures, schemas, documentation, lessons, references, and memory inside its directory.
- Give each agent its own `AGENTS.md`, `README.md`, `MISSION.md`, and `MEMORY.md`.

## Shared code

- Add code to `packages/` only when at least two active agents use it.
- Do not create shared abstractions for expected future use.
- Use the root `pnpm-lock.yaml` for all JavaScript and TypeScript workspaces.

## Documentation

Write new and changed documentation in Simplified Technical English. Use short sentences and active voice.

## Verification

Run the checks required by the nearest applicable `AGENTS.md` file before committing.
