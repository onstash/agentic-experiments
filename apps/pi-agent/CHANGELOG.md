# Changelog

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
