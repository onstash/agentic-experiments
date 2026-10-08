# Plan: pi-checklist reliability, scale, and agent ergonomics

## Status
Draft

## Objective
Improve `pi-checklist` so that:

1. The light-theme widget is readable.
2. Checklists with more than five requested items are handled explicitly.
3. Agents cannot treat a checklist item as done without observable validation.
4. The public command and tool API is intuitive for agents, with unnecessary complexity removed.

## Scope

### In scope
- `pi-extensions/pi-checklist/src/render.ts`
- Checklist size validation and its public error behavior.
- Checklist tool schemas, descriptions, result messages, and README guidance.
- Tests and documentation needed to make the behavior explicit.
- API review using `ponytail`, `api-and-interface-design`, and `code-simplification`.

### Out of scope
- Replacing Pi's event persistence model.
- Adding a dashboard or interactive checklist UI.
- Adding a second checklist implementation.
- Making the widget mutable.

## Current context

- The extension is session-scoped and persists versioned events.
- `checklist_create` replaces the current checklist.
- The README says creation supports up to five tasks.
- `ChecklistError` already has a `too-many-tasks` code.
- Only one task may be `ongoing`.
- Dependencies must be complete before a task can start.
- `renderWidget` colors the header with `accent`, ongoing tasks with `warning`, and all other rows with `text`.
- The reported screenshot shows poor readability in the light theme, most likely because completed rows use the general `text` color and completed state is only represented by a low-salience icon.

## Work breakdown

### 1. Fix the light-theme UI

- [ ] Inspect the latest Desktop screenshot and reproduce the widget in Pi's light theme.
- [ ] Confirm whether the root cause is theme color selection, completed-state styling, or both.
- [ ] Prefer Pi theme roles over hard-coded ANSI colors.
- [ ] Make completed rows visually distinct while retaining readable contrast.
- [ ] Preserve width truncation and Unicode-safe output.
- [ ] Add or update render tests for header, ongoing, blocked, planned, and done rows.
- [ ] Verify both light and dark themes if the available test surface allows it.

**Acceptance criteria**

- Completed task text is readable in the light theme.
- Ongoing and blocked states remain distinguishable.
- No hard-coded color bypasses Pi's active theme.
- Existing width limits still hold.

### 2. Define behavior for more than five items

First determine whether five is a product constraint or only an implementation constraint. Do not silently truncate or silently drop tasks.

- [ ] Trace validation through `ChecklistCreateParams`, command/tool handlers, store validation, and event creation.
- [ ] Confirm the current behavior for `0`, `1`, `5`, and `6` tasks.
- [ ] Choose one explicit policy:
  - **Recommended default:** reject more than five with `too-many-tasks`, return the accepted maximum, and preserve the existing checklist.
  - Allow more than five only if the widget, tool output, and tests are intentionally redesigned for larger lists.
- [ ] Make the limit discoverable in the tool description, schema-facing documentation, README, and error message.
- [ ] Ensure failed creation is atomic: no clear event or partial additions are persisted.
- [ ] Add tests for six tasks, retry after rejection, and preservation of the previous checklist.

**Acceptance criteria**

- An agent receives an actionable error instead of silent loss.
- The previous checklist remains intact after a rejected request.
- The behavior is identical through every public entry point.

### 3. Validate that items are actually done

A status flag alone cannot prove that work happened. Keep the checklist state simple, but require evidence at the agent/API boundary.

- [ ] Define “done” as a claim that must include a short verification note or evidence reference, rather than proof inferred from the model's text.
- [ ] Decide the minimum durable representation:
  - preferred minimal option: add `evidence` or `verification` to a done update;
  - avoid storing large logs in checklist events; store concise commands, test names, commit IDs, or file references.
- [ ] Specify whether evidence is required for every task or only when moving to `done`.
- [ ] Reject `done` transitions without required evidence, or mark them `claimed` until verification is recorded. Choose one model before implementation.
- [ ] Fix the state machine so every terminal-looking completion can be corrected: a task marked `done` without valid verification must be resettable to `planned` (or an explicitly named equivalent), without deleting the task or recreating the checklist.
- [ ] Define the allowed reverse transition and its guard conditions. The reset must clear stale completion evidence, preserve task identity and dependencies, and return an actionable result.
- [ ] Ensure invalid transitions are rejected consistently, including `done → planned` when the task is genuinely verified if that transition is not allowed by the selected model.
- [ ] Provide a read result that includes the evidence and verification state.
- [ ] Document that the checklist extension validates declared evidence, not truth independently.
- [ ] Add tests for missing evidence, valid evidence, repeated updates, dependency progression, and recovery from an unverified `done` state to `planned`.
- [ ] Add an agent-facing instruction: after implementation, run the relevant check, report its exact command/result, then mark the task done; if completion was premature or unverified, reset it instead of creating a replacement task.

**Important boundary**

The extension cannot independently prove arbitrary work. It can enforce evidence-shaped claims and optionally verify narrow, machine-checkable checks. Do not build a general sandbox or an automatic truth oracle without a concrete requirement.

**Acceptance criteria**

- An agent cannot mark work done through the public API without the selected evidence contract.
- Evidence is concise, inspectable, and persisted or clearly linked.
- The API communicates the difference between planned, ongoing, claimed, and verified completion.
- An unverified completion can always be recovered to `planned` through a documented public operation.

### 4. Review and simplify the API for agents

Use these skills during analysis and implementation:

- `ponytail`: remove speculative features, duplicate representations, and unnecessary abstractions.
- `api-and-interface-design`: make contracts, errors, state transitions, and result semantics explicit.
- `code-simplification`: reduce naming, branching, and indirection without changing required behavior.

Review these public surfaces:

- `checklist_create`
- `checklist_read`
- `checklist_update`
- `/checklist`
- `ChecklistCreateParams`, `ChecklistReadParams`, `ChecklistUpdateParams`
- `Status`, transitions, dependencies, and `ChecklistErrorCode`
- Tool descriptions and returned summaries
- README examples and agent instructions

For each surface, answer:

- Can an agent infer the operation without reading source code?
- Are required and optional fields obvious?
- Are invalid transitions and dependency failures actionable?
- Does the response say what changed and what remains blocked?
- Can the agent distinguish accepted, rejected, claimed, and verified work?
- Is the same concept represented once, with one canonical name?
- Can the simplest valid workflow be expressed with the fewest calls?

- [ ] Build a small API behavior table with inputs, outputs, errors, and examples.
- [ ] Remove or rename only after checking all callers and persisted event compatibility.
- [ ] Prefer additive, backwards-compatible changes where event replay or existing sessions are affected.
- [ ] Update tool descriptions before adding new abstractions.
- [ ] Keep the command read-only unless a concrete agent workflow requires mutation.
- [ ] Add one end-to-end test for the intended agent workflow.

**Acceptance criteria**

- A new agent can create, inspect, update, and verify a checklist from the README and tool schemas alone.
- Errors identify the failed item, reason, and corrective action.
- The API has no speculative configuration or duplicate state model.

## Suggested implementation order

1. Establish regression tests and capture current behavior.
2. Fix render colors and completed-row presentation.
3. Make the five-item limit atomic and explicit.
4. Decide and document the evidence model and reversible state transitions before changing types/events.
5. Implement the smallest evidence contract and recovery transition that satisfy the decision.
6. Review the complete API and simplify names, messages, and examples.
7. Run formatting, linting, build, and package tests.

## Verification commands

From the repository root:

```sh
pnpm exec oxfmt --check pi-extensions/pi-checklist/src pi-extensions/pi-checklist/*.json
pnpm exec oxlint pi-extensions/pi-checklist/src
pnpm --filter pi-checklist test
```

Also manually load the built extension and inspect the widget in Pi's light theme:

```sh
pi --extension ./pi-extensions/pi-checklist/dist/index.js
```

## Open decisions

- [ ] Is five a deliberate UI limit, or should the widget support paging/scrolling?
- [ ] Should completion evidence be required, or should the API distinguish `claimed` from `verified`?
- [ ] Can evidence be a short string, or is a structured object needed?
- [ ] Which checks are safe to automate, if any?
- [ ] Must old persisted events replay unchanged after the API changes?

## Completion criteria

- [ ] Light-theme issue fixed and tested.
- [ ] More-than-five behavior is explicit, atomic, documented, and tested.
- [ ] Completion validation policy is decided, implemented, documented, and tested.
- [ ] API review is recorded with before/after decisions.
- [ ] Ponytail simplification review finds no unnecessary new abstraction.
- [ ] Required checks pass.
- [ ] README describes the final agent workflow.
