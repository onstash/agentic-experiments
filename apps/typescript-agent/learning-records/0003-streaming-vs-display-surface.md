# Learning Record 0003: Streaming Vs Display Surface

## Date

2026-07-09

## What Clicked

The learner now understands that:

- Pi AI streaming exposes the runtime while the agent is working
- the terminal UI is only one display surface for those streamed events

## Why It Matters

This distinction prevents a common design mistake: coupling the agent runtime to a single UI.

If the runtime is modeled as a stream of structured events, the same agent can later be rendered in:

- a terminal
- a web UI
- logs
- tests

## Next Step

Teach the first practical tool layer:

- one OSS search tool
- one job search tool
- one shared normalized output type
