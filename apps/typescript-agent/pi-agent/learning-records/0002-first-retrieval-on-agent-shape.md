# Learning Record 0002: First Retrieval On Agent Shape

## Date

2026-07-09

## What The Learner Recalled

- A shared opportunity type is useful because OSS and job items mainly differ by `kind`.
- The learner partially recalled the CLI flow.
- The learner incorrectly answered the runtime visibility question as "TUI / terminal UI."

## Correction

The important concept is not the terminal itself. The Pi AI feature that makes the runtime visible is the streamed event interface, typically used via `models.stream(...)`.

The first CLI's required behaviors are:

- accept a small profile
- fetch a few OSS and job candidates
- print the top five with one-line explanations
- show stream events while the run happens

## Why This Matters

The learner is already noticing the unification idea, which is the heart of the architecture. The next gap is distinguishing:

- the display surface, such as a terminal
- the runtime mechanism, such as event streaming

## Next Step

Teach the exact Pi AI CLI skeleton in TypeScript:

- models collection
- tool definitions
- context creation
- stream handling
