# ADR-001: Use a deterministic opportunity pipeline

## Status

Accepted

## Date

2026-08-08

## Context

The agent combines GitHub issues from several search paths. Each path returns
different fields and labels. The model needs one stable input shape.

The result must be inspectable before any model call. Search results must also
remain reproducible in tests and evals.

## Decision

Use a deterministic pipeline with these stages:

1. Convert GitHub results to one issue-level `Opportunity` contract.
2. Remove duplicate issue URLs.
3. Classify opportunity quality.
4. Rank results with query fit, profile fit, freshness, effort, repository
   credibility, and issue state.
5. Pass the ranked results to the optional model runtime.

Use recorded GitHub fixtures for tests and evals. Keep GitHub access read-only.

## Alternatives Considered

### Pass raw GitHub responses to the model

Rejected because response shapes vary by search path. Raw data also makes
ranking and tests difficult to inspect.

### Let the model rank raw search results

Rejected because ranking would be less reproducible. It would also make the
reason for a recommendation harder to verify.

### Use live GitHub data in tests

Rejected because network data changes and can fail because of rate limits.

## Consequences

- Search adapters have a stable boundary.
- Ranking reasons remain visible to tests and users.
- Recorded fixtures keep normal tests deterministic.
- New search sources must map to the `Opportunity` contract.
- The model receives a smaller and more controlled input.
