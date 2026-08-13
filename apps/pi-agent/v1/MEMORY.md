# Pi agent memory

## Scope

This memory file applies to `apps/pi-agent/`.

## Current state

- The agent validates profiles and ranks GitHub opportunities.
- GitHub search is read-only and uses bounded pagination, timeouts, retries, and response validation.
- The agentic loop runs the planned queries up to `maxQueries`.
- Streamed recommendations use Earendil Pi sessions and JSONL persistence.
- Use `@earendil-works/pi-coding-agent` for session lifecycle and `@earendil-works/pi-ai` for model APIs.
- Recommendations use typed evidence with source, provenance, freshness, and certainty.
- The policy layer blocks unsupported actions and marks application actions for approval.
- The recommender receives only actionable opportunities.
- The loop emits versioned run metadata with each event.

## Working rules

- Follow `apps/pi-agent/AGENTS.md`.
- Keep changes inside `apps/pi-agent/`.
- Use recorded fixtures for deterministic tests.
- Do not log credentials, tokens, OAuth data, or private authentication data.
- Keep GitHub access read-only.
- Keep discovery, classification, policy, and recommendation as separate stages.
- Keep deterministic checks at trust boundaries. Do not add scattered text rules to the model flow.
- Do not use free-text `nextAction` text to authorize an action.
- Do not mark a GitHub issue as a direct job without an exact application URL.
- Do not use fixed numeric confidence values without a defined scoring model.
- Compute freshness from the source timestamp. Do not mark every source as current.
- Return validated recommendation documents. Do not return raw model output after validation.
- Do not add early-stop thresholds when `maxQueries` already bounds the run.
- Keep one agent loop. Do not maintain a legacy loop with different result and event contracts.

## RCA and regression notes

- Job aggregation titles with `role(s)` normalized to `role s`. The original pattern missed this form and allowed a job record into recommendations. Test punctuation variants after normalization.
- The loop stopped after query one because it used an actionable-count and repository-count threshold. The final loop runs the bounded query plan unless a future, explicit policy requires early stopping.
- Stream mode printed the validated recommendation and the CLI printed it again. Keep rendering in one layer.
- A policy result of `review` was previously treated as success. Treat approval as a separate run state before any side effect.
- A validated recommendation was previously discarded while raw model text was returned. Keep the validated object as the public result.
- A duplicate legacy loop caused different iteration and result behavior. Remove duplicate orchestration contracts.
- Run metadata is useful only when it is persisted with events and bound to policy, prompt, and schema versions.

## Verification

Run `pnpm check`, `pnpm test`, and `pnpm eval` from `apps/pi-agent/`.
