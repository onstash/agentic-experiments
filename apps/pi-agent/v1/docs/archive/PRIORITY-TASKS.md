# Pi Agent Priority Tasks

Status values:

- `TODO`: not started
- `IN-PROGRESS`: started but incomplete
- `DONE`: complete for the current scope

## Priority order

| Priority | Task                                        | Status | Completion condition                                                                                |
| -------- | ------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| P0       | Define the issue-level opportunity contract | DONE   | Results include issue URL, repository URL, labels, state, timestamps, and source metadata.          |
| P0       | Improve GitHub search quality               | DONE   | Search finds relevant open issues without requiring `good first issue` or `help wanted`.            |
| P0       | Improve deterministic ranking               | DONE   | Ranking uses query match, profile fit, recency, effort, confidence, and clear reasons.              |
| P0       | Add recorded GitHub fixtures                | DONE   | Tests and evals use stable local fixtures instead of live GitHub data.                              |
| P0       | Make the required checks pass               | DONE   | `pnpm check`, `pnpm test`, and `pnpm eval` pass from `apps/pi-agent/`.                              |
| P1       | Add issue-quality classification            | DONE   | Results identify actionable, stale, duplicate, broad, and blocked opportunities.                    |
| P1       | Add a bounded multi-step agent loop         | DONE   | The agent can search, evaluate, refine, deduplicate, rank, and stop within a limit.                 |
| P1       | Add JSONL session logging                   | DONE   | Runs store structured events with secrets and sensitive data redacted.                              |
| P1       | Harden streamed recommendations             | DONE   | The model uses only supplied results, cites an allowed URL, and rejects unknown URLs.               |
| P1       | Expand tests for failure paths              | DONE   | Tests cover API errors, rate limits, invalid data, duplicates, and missing credentials.             |
| P2       | Add GitHub API resilience                   | DONE   | Add pagination, timeouts, bounded retries, rate-limit messages, and response validation.            |
| P2       | Improve profile and query normalization     | DONE   | Support common aliases, exclusions, and user effort preferences.                                    |
| P2       | Complete safety and privacy controls        | DONE   | Keep GitHub access read-only, redact secrets from logs and model input, and validate streamed URLs. |

## Current completed capabilities

- `DONE` Profile file and inline JSON input.
- `DONE` Profile schema validation.
- `DONE` GitHub issue search adapter.
- `DONE` Deterministic ranking skeleton.
- `DONE` Codex OAuth login flow.
- `DONE` Optional Pi AI streaming.
- `DONE` Basic tests and eval runner.

## Current verification note

`pnpm check`, `pnpm test`, and `pnpm eval` pass.

## Current state

The original priority list is now updated to reflect the completed Pi-agent
work. The next implementation priority is hardened streamed recommendations.
Profile and query normalization remains open. Safety and privacy controls need
a focused review for model input and persistent session data.
