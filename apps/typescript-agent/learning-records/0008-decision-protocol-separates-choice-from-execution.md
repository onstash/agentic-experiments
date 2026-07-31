# Learning Record 0008: Decision Protocol Separates Choice From Execution

## Date

2026-07-20

## What The Learner Is Ready For

The learner now has:

- a streamed runtime
- a bounded loop
- explicit stop reasons
- visible tool execution events

## New Insight

The next architectural move is to separate:

- deciding what to do next

from:

- actually doing it

The runtime should not hide all agent behavior inside loop branches.

## Why It Matters

This separation makes room for:

- cleaner runtime tests
- richer debug traces
- step-level evaluation
- future memory reads and writes

## Next Step

Teach the first explicit decision shape:

- `call_tool`
- `stop`
