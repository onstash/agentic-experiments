# Memory

## 2026-07-07

### Mistake: mixing streaming and final return values in one turn function

We tried to make `run_turn_with_events(...)` both:

- stream events with `yield`
- return final `state` and `result` in the normal way

That is a bad shape because a generator function and a normal return flow do not fit together cleanly.

### Why it was wrong

- `yield` means the caller consumes values one by one
- `return` means the function finishes and hands back a final result
- trying to do both in one function made the runtime confusing and logically awkward

### Fix

Keep the concerns separate:

1. `run_turn(...)`
   - returns final `state` and `AgentRunResult`

2. `stream_turn_events(...)`
   - yields events one by one for streaming

3. If needed, a wrapper can coordinate both
   - but do not force one function to behave like both a generator and a normal return function

### Rule of thumb

If the goal is streaming, use `yield`.
If the goal is final output, use `return`.
If the goal is both, split the work into two functions or a wrapper.

### Better reference pattern: OpenAI Agents SDK

The cleaner pattern is:

- consume events from `result.stream_events()`
- after streaming ends, read `result.final_output`
- while streaming, `final_output` is `None`
- after completion, `final_output` contains the final answer

### Why this is better

- events and final output are both part of the same result object
- streaming stays streaming
- final output stays final output
- the caller gets a simple and clear API

### Lesson for our codebase

Prefer a design where:

1. the stream exposes events while the agent is working
2. the final result is read after the stream completes
3. the two concerns stay linked, but not mixed into one confusing return shape

## 2026-07-07

### Mistake: going in loops and making the design more confusing

We kept trying to explain the same streaming/result problem in slightly different shapes, which made the runtime design worse instead of clearer.

### Why it was wrong

- the discussion repeated the same mistake instead of settling the shape
- the code kept drifting between generator style, collected events, and final return values
- that created more confusion instead of a clean teaching path

### Fix

- stop re-litigating the same shape in different words
- choose one clean design and stick to it
- keep the tutorial and code aligned with that one design
- update memory when a mistake is repeated so we do not loop back into it

### Rule of thumb

If a runtime shape is already confusing, do not keep iterating on it verbally in circles.
Write down the mistake, write down the fix, and move to the cleaner shape once.

## 2026-07-21

### Teaching mode: continue from the handoff

The user is learning by building a Pi-inspired TypeScript opportunity agent.
Lessons 1-8 are completed and recorded. The next course milestone is Lesson 9:
step evaluation.

Relevant teaching artifacts live under:

- `apps/pi-agent/lessons/`
- `apps/pi-agent/learning-records/`
- `apps/pi-agent/reference/`

The project mission is in `apps/pi-agent/MISSION.md`.

### User preference: teach before changing code

The user wants explicit teaching and collaborative guidance, not silent
implementation. Explain the concept, identify the smallest change, and wait
for an explicit implementation request before editing code or creating
artifacts.

### Scope boundary

Do not infer permission to implement from a request to continue, inspect,
analyze, or guide. Those requests authorize explanation and read-only review.
Only modify files when the user explicitly asks to create, update, fix,
implement, or otherwise change them.

### Current runtime concepts learned

- `streamRuntime(...)` is the canonical streaming API.
- `maxIterations` bounds the loop.
- `decideNextAction(...)` separates choosing from executing.
- `step_evaluated` is the next runtime concept: evaluate result usefulness and
  whether another action is justified.

### Git hygiene

Keep runtime code commits separate from teaching-artifact commits. Before any
commit, inspect staged and unstaged files and confirm the user requested the
commit.

### TypeScript lesson: preserve tool/result correlation

`RuntimeStreamChunk` is a discriminated union:

- `toolName: "search_oss"` must carry OSS results
- `toolName: "search_jobs"` must carry job results

These two independent union values are not enough for TypeScript to prove the
relationship:

```ts
toolName: "search_oss" | "search_jobs";
result: OssResult[] | JobResult[];
```

When yielding a typed event, narrow on the tool name first and construct the
matching result inside that branch. TypeScript then knows the pair is valid.

Rule of thumb:

> When two values are related by a discriminant, narrow the discriminant before
> using or returning the related value.

### Lesson 9 status

Step evaluation is being taught but is not yet fully complete in the runtime.
Remaining concerns include:

- emit `step_evaluated` events
- keep `evaluateToolResult(...)` focused on evaluation
- ensure empty results with remaining tools mean `useful: false` and
  `shouldContinue: true`
- preserve tool/result typing when emitting `tool_executed`

## 2026-08-08

### Mistake: modifying `typescript-agent` while focused on `pi-agent`

We changed files under `apps/typescript-agent/` while the active learning and
implementation focus was `apps/pi-agent/`.

### RCA

- The repository contains two similarly named TypeScript agent applications.
- The active focus was not re-checked against the handoff and project memory
  before planning the change.
- A prior suggestion about improving issue-level search was treated as the
  current implementation target without confirming the target app.
- The change also introduced fixture data before establishing the intended
  scope and data model.

### Fixes

- Treat `apps/pi-agent/` as the active application unless the user explicitly
  names another app.
- Before editing, inspect `MEMORY.md`, the relevant `AGENTS.md`, and the
  handoff, then state the exact files and app in scope.
- Do not edit a similarly named app based on inference. Ask when the target is
  ambiguous.
- Keep changes limited to the requested scope; do not add illustrative or
  fabricated fixture data unless explicitly requested.
- After editing, verify `git diff --stat` and `git status` for accidental
  changes outside the active app.
