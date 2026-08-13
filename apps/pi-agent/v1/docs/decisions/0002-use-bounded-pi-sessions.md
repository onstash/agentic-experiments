# ADR-002: Use bounded Pi sessions for streamed recommendations

## Status

Accepted

## Date

2026-08-08

## Context

The deterministic pipeline produces ranked opportunities. Users can request a
streamed recommendation with optional model assistance.

The runtime must stop predictably. Session data must support later inspection
without exposing credentials or private authentication data.

## Decision

Use the Earendil Pi coding-agent session manager for streamed runs. Use the Pi
AI runtime for model interaction. Store sessions as JSONL files.

Keep the agent loop bounded by `maxIterations`. Pass the profile, query, and
ranked opportunities to the model as the complete recommendation context.

Keep the deterministic JSON output path independent from model authentication.
Require authentication only for the streamed path.

## Alternatives Considered

### Use an unbounded model loop

Rejected because a model can repeat actions or consume an uncontrolled amount
of time and tokens.

### Build a custom session store

Rejected because Pi already provides session lifecycle and JSONL persistence.

### Require model authentication for every run

Rejected because deterministic output and tests do not need model access.

## Consequences

- Streamed runs support Pi session inspection and later continuation.
- Bounded execution limits runaway work.
- Deterministic runs remain usable without OAuth credentials.
- Session handling must continue to redact credentials and sensitive data.
- Future changes to model context must preserve the supplied-results boundary.
