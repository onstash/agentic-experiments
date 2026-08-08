# Repository instructions

## Scope

This file applies to the repository unless a deeper `AGENTS.md` file gives more specific instructions.

## Language

Write new and changed documentation in Simplified Technical English. Use short
sentences, active voice, and one clear meaning for each term. Keep code,
identifiers, commands, file paths, and quoted errors unchanged.

Use Simplified Technical English for writing guidance.

## Application boundaries

- Keep `apps/pi-agent/` changes inside that application.
- Follow the local rules in [apps/pi-agent/AGENTS.md](apps/pi-agent/AGENTS.md).
- Do not read from, import from, or modify another application unless the user names it.
- Keep tests, fixtures, schemas, and documentation with the application that owns them.

## Verification

Run the checks required by the nearest applicable `AGENTS.md` file before committing.

## Memory files

- [apps/pi-agent/MEMORY.md](apps/pi-agent/MEMORY.md) stores memory for the Pi opportunity agent.
- [apps/typescript-agent/MEMORY.md](apps/typescript-agent/MEMORY.md) stores memory for the TypeScript learning agent.
- [MEMORY.md](MEMORY.md) indexes both application memory files.
