# Pi agent memory

## Scope

This memory file applies to `apps/pi-agent/`.

## Current state

- The agent validates profiles and ranks GitHub opportunities.
- GitHub search is read-only and uses bounded pagination, timeouts, retries, and response validation.
- The agent loop is bounded by `maxIterations`.
- Streamed recommendations use Earendil Pi sessions and JSONL persistence.
- Use `@earendil-works/pi-coding-agent` for session lifecycle and `@earendil-works/pi-ai` for model APIs.

## Working rules

- Follow `apps/pi-agent/AGENTS.md`.
- Keep changes inside `apps/pi-agent/`.
- Use recorded fixtures for deterministic tests.
- Do not log credentials, tokens, OAuth data, or private authentication data.
- Keep GitHub access read-only.

## Verification

Run `pnpm check`, `pnpm test`, and `pnpm eval` from `apps/pi-agent/`.
