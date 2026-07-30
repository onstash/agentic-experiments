# Learning Record 0010: Episodic Memory Preserves Run History

## Date

2026-07-28

## What The Learner Is Ready For

The learner now has:

- a streamed runtime
- a bounded loop
- a decision protocol
- step evaluation events

## New Insight

Streaming makes a run visible while it is happening, but the stream disappears when the process exits. Episodic memory preserves one completed run as a historical Markdown record.

## Design Choice

Store one run per file under:

```text
apps/pi-agent/memory/episodic/
```

Each file should contain the query, steps, evaluations, outcome, and stop reason.

## Boundary

Episodic memory records what happened. It does not yet extract durable facts or alter future decisions.

## Next Step

Implement a persistence boundary that consumes a completed runtime trace and writes one Markdown run record.
