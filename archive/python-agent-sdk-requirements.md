# Python Agent SDK Tutorial Requirements

## Purpose

This project should teach how to build agents from first principles in Python while also producing a practical read-only GitHub opportunity agent.

The tutorial should not begin with GitHub-specific code only.
It should first explain the core runtime ideas of an agent SDK, then apply those ideas to the GitHub opportunity domain.

## Teaching Strategy

The tutorial should use a two-track teaching model inside one linear curriculum:

- first teach a generic Python agent runtime from first principles
- then apply the same runtime patterns to the GitHub opportunity agent

This keeps the abstractions understandable before domain-specific details are introduced.

## Core Design Principles

The tutorial and implementation should be guided by these principles:

- plain and explicit Python first
- function-first orchestration before introducing classes
- structured data models for clarity
- terminal-first developer experience
- evented runtime behavior
- append-only persistence where possible
- inspectability over cleverness
- read-only GitHub domain scope at first

## Pi-Inspired Runtime Qualities

This project is inspired by a few runtime qualities observed in Pi-like systems.
These should be tutorial requirements for our SDK, not hidden implementation details.

### 1. Message tree with branching

The runtime should treat a session as a tree, not only as a flat transcript.

This means:

- entries have identifiers
- entries can reference a `parent_id`
- the runtime can track the active leaf
- a session can be forked into a new branch
- branch-aware summaries can be added later

### 2. Fast terminal-first interaction

The runtime should feel responsive in the terminal.

This means:

- stream output incrementally
- expose lifecycle events
- keep state transitions understandable
- optimize for debugging and iteration from the command line

### 3. Append-only JSONL session logs

The runtime should persist session history in append-only JSONL files.

This means:

- one session file per run or branch
- one JSON object per line
- appending new events instead of rewriting the entire file
- replay and debugging should be possible from logs alone

## Scope

### In scope

- first-principles agent runtime in Python
- generic tutorial agent
- event loop and message lifecycle
- structured models for messages, state, and results
- session persistence with JSONL
- branch/fork concepts
- terminal-first execution
- observability and replay
- eval foundations
- applied GitHub opportunity agent built on top of the runtime

### Out of scope for the first version

- write-enabled GitHub actions
- autonomous code changes on external repositories
- multi-agent orchestration
- web UI first
- production deployment concerns
- advanced memory and retrieval systems

## Success Criteria

The tutorial is successful if a learner can:

- explain what an agent loop is
- implement a simple agent in plain Python
- understand the difference between internal messages and model-facing messages
- run an evented terminal agent locally
- inspect session logs on disk
- understand how branching/forking works
- build a read-only GitHub opportunity agent on top of the runtime

The implementation is successful if the repo contains:

- a minimal generic agent runtime
- JSONL session persistence
- a branch-aware session model
- a runnable terminal entry point
- an applied GitHub opportunity example

## Architecture Requirements

The tutorial should gradually introduce these runtime layers.

### Layer 1: Core data model

Define structured models for:

- message
- session entry
- agent state
- tool result or action result
- evaluation fixture where needed later

Recommendation:

- use `pydantic` for structured models at the edges
- keep internal logic explicit and simple

### Layer 2: Agent loop

Define the minimal loop:

1. observe current state
2. choose next step
3. emit lifecycle events
4. produce new messages or results
5. update session state
6. stop or continue

The early tutorial version can be function-based.

### Layer 3: Event model

The runtime should expose observable lifecycle events such as:

- agent start
- turn start
- message start
- message update
- message end
- turn end
- agent end
- error

These events should support terminal rendering and debugging.

### Layer 4: Session model

The runtime should model a session as tree-shaped history.

Minimum requirements:

- each entry has an `id`
- each entry has a `parent_id`
- the session tracks the current active leaf
- entries can be traversed back to the root

### Layer 5: Persistence model

Persist session history using JSONL.

Minimum requirements:

- session metadata/header
- append-only entry writes
- ability to load a session from disk
- ability to reconstruct current leaf state
- ability to replay a session

### Layer 6: Forking model

The runtime should support creating a new session branch from an existing point.

Minimum requirements:

- choose a source session and target entry
- create a new branch/session
- preserve lineage
- keep the fork understandable from logs

### Layer 7: Terminal UX

The tutorial should include a terminal-first way to run the agent.

Minimum requirements:

- run a session from CLI
- stream partial output
- inspect saved session logs
- show enough information to debug a run

### Layer 8: Observability

Observability should be taught as a first-class concept, not an afterthought.

Minimum requirements:

- event stream visibility
- persisted logs
- timestamps
- replay capability
- easy inspection of agent decisions

### Layer 9: Evals

Evals should appear after the runtime behavior is stable enough to test.

Minimum requirements:

- define example inputs
- define expected outcomes
- check ranking or decision behavior
- support simple regression checks

## Applied Domain Requirements: GitHub Opportunity Agent

After the generic runtime is understood, the tutorial should apply it to a read-only GitHub opportunity agent.

### Domain goal

Help a user find open source repositories that are good opportunities to contribute to.

### First-version domain signals

- skill fit
- experience fit
- interest match
- repo activity
- contribution potential
- optional company or remote signals later

### First-version domain constraints

- keep it read-only
- start with local/mock/sample data
- no real GitHub API dependency in the earliest tutorial chapters
- make ranking understandable before making it sophisticated

## Chapter Plan With Milestones

### Chapter 1: What an agent is

Teach:

- what makes software an agent
- the difference between input/output scripts and loops
- the basic observe-decide-act idea

Milestone:

- glossary of core terms
- pseudocode for the smallest possible agent loop

### Chapter 2: Messages, state, and results

Teach:

- what the runtime needs to track
- internal messages vs model-facing messages
- why structured state matters

Milestone:

- first Python models for messages and state

### Chapter 3: The first agent loop in plain Python

Teach:

- a function-first loop
- how state moves through one run
- why classes are optional early on

Milestone:

- a runnable generic `run_agent(...)` function

### Chapter 4: Events and streaming

Teach:

- why agent runtimes should emit events
- incremental updates vs final output only
- terminal rendering basics

Milestone:

- a small event model and a terminal demo that streams output

### Chapter 5: Sessions and JSONL logs

Teach:

- why sessions matter
- why append-only logs are useful
- how replay and debugging become easier

Milestone:

- JSONL-backed session persistence
- session header and appended entries

### Chapter 6: Tree-structured history and forking

Teach:

- why a flat transcript is limiting
- how parent-linked entries form a tree
- what an active leaf means

Milestone:

- session entries with `id` and `parent_id`
- basic fork capability

### Chapter 7: Observability and replay

Teach:

- how to inspect runs
- how to replay a session
- how to debug the runtime from logs and events

Milestone:

- replay or inspect command for saved sessions

### Chapter 8: A tiny generic tutorial agent

Teach:

- put the generic runtime pieces together
- keep the example non-GitHub-specific

Milestone:

- fully working toy agent built on the runtime

### Chapter 9: Mapping the runtime to the GitHub opportunity problem

Teach:

- how a domain-specific agent sits on top of the generic runtime
- what domain models are needed

Milestone:

- `Profile`
- `RepoCandidate`
- first domain-oriented agent state

### Chapter 10: Ranking and decision policy

Teach:

- how a domain policy is separate from the runtime
- how to keep the first scoring pass simple

Milestone:

- ranking function over sample repo candidates

### Chapter 11: Build the read-only GitHub opportunity agent

Teach:

- wire the domain policy into the runtime
- keep the loop inspectable

Milestone:

- runnable opportunity agent over local/sample data

### Chapter 12: Evals for agent behavior

Teach:

- how to define expected outcomes
- how to prevent regressions

Milestone:

- simple eval fixtures and checks for ranking/selection behavior

### Chapter 13: Advanced runtime ideas

Teach:

- compaction
- branch summarization
- richer tool/runtime patterns
- future multi-agent or external integration ideas

Milestone:

- roadmap and optional advanced implementations

## Suggested Early Repository Shape

The tutorial should move toward a layout similar to this:

```text
apps/python-agent/
  src/github_opportunity_agent/
    models.py
    events.py
    session.py
    storage.py
    agent.py
    ranking.py
    cli.py
```

This is only a directional shape, not a rigid requirement.

## Teaching Constraints

The tutorial should:

- prefer small steps
- avoid hiding important behavior behind too much abstraction
- explain why each runtime piece exists
- avoid introducing advanced class hierarchies too early
- keep code runnable at each milestone

## Final Recommendation

Build the Python agent SDK tutorial around runtime primitives first:

- loop
- messages
- events
- session tree
- JSONL persistence
- forking
- observability

Then use the GitHub opportunity agent as the main applied example built on top of those primitives.
