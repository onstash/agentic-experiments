# Changelog

## 0.6.0

### Minor Changes

- Add typed source evidence and action policy decisions.
- Require approval for application actions.
- Remove the duplicate agent loop and early-stop threshold.
- Return validated recommendation documents.
- Compute evidence freshness from source timestamps.
- Record run metadata with each agent event.
- Record the RCA and regression rules in `MEMORY.md`.
- Preserve earlier results when a later search hits a GitHub rate limit.

## 0.5.0

### Minor Changes

- Add source classification for job aggregation records and direct jobs.
- Limit recommendations to actionable opportunities.
- Require verified job URLs for apply actions.
- Reject duplicate recommendations.
- Allow empty recommendations when no actionable opportunity exists.
- Add research on agent architecture and guardrails.

## 0.4.0

### Minor Changes

- Tighten recommendation grounding and bounded repair.

## 0.3.0

### Minor Changes

- - Add Valibot validation for structured model recommendations.
  - Reject unsupported claims before streamed output reaches the user.
  - Increase the default query limit to five bounded iterations.
  - Add `--max-iterations` for larger bounded searches.

## 0.2.0

### Minor Changes

- - Add URL and evidence checks for streamed recommendations.
  - Add profile aliases, query exclusions, and effort preferences.
  - Add safety guidance and tests for the new ranking controls.

## 0.1.0

### Minor Changes

- Add profile validation and inline profile input.
- Add read-only GitHub issue search.
- Add deterministic opportunity ranking.
- Add issue-quality classification.
- Add recorded GitHub fixtures and evaluation tests.
- Add a bounded multi-step agent loop.
- Add persistent Pi sessions with JSONL logging.
- Add GitHub retries, pagination, timeouts, and rate-limit errors.
- Add sensitive-data redaction for logs and model input.
- Add guarded streamed recommendations.
