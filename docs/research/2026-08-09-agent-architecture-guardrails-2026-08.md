# Agent Architecture, Agentic Harnesses, and Guardrails

Research date: 2026-08-09

Scope: Current best practices for agents, agentic harnesses, and guardrails as
of August 2026. This report uses primary sources only. It does not change
application code.

## Executive summary

An agent is a model that controls its own process and tool use. A harness is
the runtime around that model. It manages state, tools, approvals, limits,
retries, tracing, and recovery. The safest design keeps the model flexible
inside a narrow action boundary. It keeps high-risk decisions outside the
model.

The strongest common pattern is defense in depth:

1. Define the task, owner, allowed resources, and stop conditions.
2. Give the agent a small set of typed tools with least privilege.
3. Treat every external result as untrusted data.
4. Check tool inputs before execution and tool outputs after execution.
5. Require human approval for high-impact or irreversible actions.
6. Enforce deterministic limits at runtime.
7. Record traces, decisions, approvals, failures, and outcomes.
8. Test the complete workflow with normal, boundary, and adversarial cases.

This does not mean removing deterministic code. Deterministic code is the
right place for hard safety properties. The design problem is to keep that
code at explicit trust boundaries instead of scattering brittle guesses through
the agent's reasoning path.

## Definitions and architecture choices

Anthropic defines an agent as a model that directs its own process and tool use.
Its loop plans, acts, observes results, adjusts, and repeats until it completes
the task or requests human input. See [Trustworthy agents in
practice](https://www.anthropic.com/research/trustworthy-agents), published
2026-04-09.

OpenAI separates a lower-level API, where the developer owns the loop, from an
Agents SDK, where the runtime manages turns, tools, guardrails, handoffs, and
sessions. See [Agents SDK or Responses
API](https://openai.github.io/openai-agents-python/), accessed 2026-08-09.

Anthropic's official architecture guide describes three core parts of a
single-agent system: a model, a prompt, and a toolkit of integrations. It also
recommends starting with the simplest architecture that meets the task, then
adding orchestration only when the task requires it. See [Building Effective AI
Agents](https://resources.anthropic.com/hubfs/Building%20Effective%20AI%20Agents-%20Architecture%20Patterns%20and%20Implementation%20Frameworks.pdf),
2026.

Microsoft Agent Framework describes three useful layers:

- Agents call models and tools.
- A harness adds planning, context compaction, memory, approvals, and
  observability.
- Workflows provide explicit graph routing, typed state, checkpointing, and
  human-in-the-loop support.

See [Microsoft Agent Framework overview](https://learn.microsoft.com/en-us/agent-framework/overview/),
2026.

Use a single agent when one model can perform the task with a small tool set.
Use a workflow when routing, state transitions, retries, or approvals must be
explicit. Use multiple agents only when separate roles provide a measurable
benefit. Each extra agent adds communication, state, and failure surfaces.

## Practical harness pattern

```text
request
  -> input policy and identity checks
  -> task and risk classification
  -> bounded agent loop
       -> typed tool proposal
       -> tool policy and approval gate
       -> tool execution in a restricted context
       -> result validation and provenance capture
       -> state update and stop-condition check
  -> output policy and evidence checks
  -> trace, outcome, and feedback record
```

The harness should own these properties:

- Maximum turns, tool calls, wall-clock time, and cost.
- Explicit cancellation and timeout behavior.
- Idempotency or replay protection for side-effecting tools.
- Durable state for long runs and pending approvals.
- A typed event model for model calls, tool calls, policy decisions, and human
  decisions.
- A final result that reports what the agent did, what it did not do, and what
  evidence supports the result.

Microsoft documents middleware as a way to place cross-cutting behavior around
agent runs, function calls, and model calls. It lists guardrails, rate limits,
logging, telemetry, exception handling, and result overrides as middleware use
cases. See [Adding Middleware](https://learn.microsoft.com/en-us/agent-framework/journey/adding-middleware),
2026.

## Guardrail layers

### 1. Governance and task boundary

Before a run, identify the human or service owner, the user authority, the
purpose, allowed data, allowed tools, and unacceptable outcomes. Keep this
policy separate from the model prompt.

Google states three agent security principles: well-defined human controllers,
limited agent powers, and observable agent actions. It recommends combining
traditional runtime policy enforcement with reasoning-based defenses. See
[How Google secures AI Agents](https://cloud.google.com/blog/products/identity-security/cloud-ciso-perspectives-how-google-secures-ai-agents/),
2025.

### 2. Input and context controls

Validate type, size, range, encoding, and authorization at every boundary.
Separate trusted instructions from untrusted user content and retrieved data.
Mark external text as data. Do not allow external text to redefine system
policy, tools, or approval rules.

Microsoft's safety guidance calls out trust boundaries between user input,
history, context providers, the model, and tools. It recommends type and range
constraints, string limits, path checks, and parameterized queries. See [Agent
Safety](https://learn.microsoft.com/en-us/agent-framework/agents/safety),
2026.

### 3. Tool controls

Define each tool with a narrow schema, a clear effect description, an explicit
authority, and an allowed resource scope. Validate arguments again in the tool
implementation. The model's tool-call JSON is not authorization.

Use read-only tools for discovery. Separate them from tools that publish,
modify, send, delete, or spend. Return structured results with source identity,
timestamps, and confidence or completeness information when those properties
matter.

### 4. Runtime policy

Apply deterministic policies immediately before a side effect. Check the tool,
arguments, target, actor, data class, and current run state. Prefer an action
manifest or typed policy decision over keyword matching in free text.

Google describes runtime policy engines that inspect action manifests containing
properties such as dependencies, effects, authentication, and data types. See
[How Google secures AI Agents](https://cloud.google.com/blog/products/identity-security/cloud-ciso-perspectives-how-google-secures-ai-agents/).

### 5. Model-based checks

Use a separate, cheaper model for tasks such as intent classification,
ambiguity detection, or adversarial review when a deterministic rule cannot
express the policy. Treat this as a risk signal, not as the final authorization
for a high-impact action.

OpenAI documents input, output, and tool guardrails. It notes that tool
guardrails run for every custom function-tool call, including workflows with
handoffs or delegated specialists. Blocking input guardrails can prevent the
main agent from starting and can avoid token use and side effects. See
[OpenAI guardrails](https://openai.github.io/openai-agents-python/guardrails/),
accessed 2026-08-09.

### 6. Output and evidence controls

Validate the final structure, allowed claims, citations, policy status, and
grounding evidence. Do not treat a well-formed response as a correct response.
Check that each recommendation maps to a source record and that each proposed
action is supported by evidence available to the agent.

## Prompt injection and tool safety

Prompt injection is a control-flow attack. It tries to make data behave like
instructions. A prompt warning helps, but it is not a complete control.

Use multiple controls:

- Keep system policy and tool authorization outside retrieved text.
- Pass source labels and provenance with retrieved content.
- Do not expose secrets to tools that do not need them.
- Limit outbound destinations and data volume.
- Require approval for sensitive tools and unusual targets.
- Inspect tool arguments after the model proposes them and before execution.
- Inspect tool results before they enter future context.
- Make dangerous operations previewable and reversible where possible.
- Log the source of every instruction that caused a tool call.

Google's 2026 runtime-defense guidance names prompt injection, tool poisoning,
and sensitive-data leakage as runtime risks. It describes inline protection at
agent gateways, runtimes, and MCP servers. See [What's new in IAM: Security,
governance, and runtime defense](https://cloud.google.com/blog/products/identity-security/whats-new-in-iam-security-governance-and-runtime-defense),
2026.

The academic paper [AgentTrust: Runtime Safety Evaluation and Interception for
AI Agent Tool Use](https://arxiv.org/abs/2605.04785), 2026-05-06, supports a
pre-execution interception layer with structured `allow`, `warn`, `block`, and
`review` outcomes. Its results are research evidence, not a universal safety
guarantee. The practical lesson is to intercept actions at runtime, including
multi-step chains, rather than relying only on post-run benchmarks or static
filters.

## Human approval

Approval should be risk-based. Require it for irreversible changes, external
communication, financial or legal commitments, privilege changes, access to
sensitive data, and actions with uncertain targets. Allow automatic execution
for low-risk, read-only work when the scope is clear.

An approval request should show:

- The exact tool and arguments.
- The target and affected resources.
- The reason for the action.
- Evidence used by the agent.
- Expected side effects.
- A safe rejection or edit path.

OpenAI's HITL design pauses execution on sensitive tool calls, exposes the
tool name and arguments, and supports durable serialized run state for later
approval and resume. See [OpenAI human-in-the-loop](https://openai.github.io/openai-agents-python/human_in_the_loop/),
accessed 2026-08-09.

Microsoft's HITL guidance uses the same pattern: the server sends an approval
request before execution, the client shows the exact request, and the server
continues only after approval. See [Human-in-the-Loop with AG-UI](https://learn.microsoft.com/en-us/agent-framework/integrations/ag-ui/human-in-the-loop),
2026.

Do not let the model approve its own action. Store approval identity, time,
scope, decision, and the exact arguments approved. Do not silently reuse an
approval for a changed target or changed arguments.

## Evals and observability

Evaluate the whole system, not only the model's final text. Build a test set
with:

- Normal tasks and representative sources.
- Empty, stale, malformed, and conflicting data.
- Prompt injection and tool poisoning attempts.
- Ambiguous user intent.
- Duplicate and replayed tool calls.
- Approval granted, denied, delayed, and expired.
- Tool failure, timeout, rate limit, and partial completion.
- Adversarial multi-step action chains.

Track capability and safety metrics separately. Useful metrics include task
success, grounded-answer rate, unsafe-action block rate, false block rate,
approval rate, escalation rate, retry rate, cost, latency, tool error rate, and
time to recovery. Review samples of both accepted and blocked runs.

NIST's Generative AI Profile for the AI Risk Management Framework provides a
risk-management structure for governance, mapping, measurement, and
management. See [NIST AI RMF Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence),
2024, and the [official PDF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf).

OpenAI's tracing model records model generations, tool calls, handoffs,
guardrails, and custom events. It also warns that traces can contain sensitive
inputs and outputs, so capture must be controlled. See [OpenAI tracing](https://openai.github.io/openai-agents-python/tracing/),
accessed 2026-08-09.

Record enough data to reproduce a decision, but redact secrets and personal
data. Keep policy version, prompt version, model version, tool schema version,
source IDs, and approval state in the trace.

## Implications for `apps/pi-agent`

The current application is a bounded search and recommendation agent. It has a
useful deterministic safety base: typed model output, source grounding,
bounded search, action validation, and explicit handling for aggregation
sources. The main architectural risk is not that it uses deterministic code.
The risk is that some deterministic rules infer source meaning from text and
URLs, then use that inference to authorize actions.

Recommended direction, in priority order:

1. Keep deterministic checks for hard boundaries: schema validity, URL safety,
   source grounding, duplicate IDs, query and tool budgets, and allowed action
   types.
2. Replace scattered source heuristics with a typed evidence object. Include
   source kind, provenance, freshness, direct-application evidence, and an
   uncertainty state.
3. Make `apply` a separate high-risk capability. Require an exact verified
   application target and human approval. A GitHub issue should not become a
   direct employer application only because its text resembles a job post.
4. Separate discovery records from actionable opportunities before the model
   sees them. Preserve all records for audit, but give the recommender only the
   records it may recommend.
5. Emit one event per completed query, tool call, policy decision, and model
   decision. Report actual execution state after early stops and failures.
6. Add adversarial evals for prompt injection in issue text, aggregation-source
   misclassification, stale links, duplicate recommendations, malformed model
   output, and approval denial.
7. Add a risk-based approval state to the run model. A recommendation may be
   automatic; an external application action must pause and resume through an
   explicit approval record.
8. Add a replayable run record with policy, prompt, model, source, and schema
   versions. This will make false positives and false negatives diagnosable.

The target architecture is a model-led discovery loop inside a deterministic
execution boundary. The model may propose. Typed policy decides whether the
proposal is safe to execute. A human decides when the consequence is high.

## Source register

- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/), accessed
  2026-08-09.
- [OpenAI guardrails](https://openai.github.io/openai-agents-python/guardrails/),
  accessed 2026-08-09.
- [OpenAI human-in-the-loop](https://openai.github.io/openai-agents-python/human_in_the_loop/),
  accessed 2026-08-09.
- [OpenAI tracing](https://openai.github.io/openai-agents-python/tracing/),
  accessed 2026-08-09.
- [Anthropic, Trustworthy agents in practice](https://www.anthropic.com/research/trustworthy-agents),
  2026-04-09.
- [Anthropic, Building Effective AI Agents](https://resources.anthropic.com/hubfs/Building%20Effective%20AI%20Agents-%20Architecture%20Patterns%20and%20Implementation%20Frameworks.pdf),
  2026.
- [Microsoft Agent Framework overview](https://learn.microsoft.com/en-us/agent-framework/overview/),
  2026.
- [Microsoft Agent Safety](https://learn.microsoft.com/en-us/agent-framework/agents/safety),
  2026.
- [Microsoft Adding Middleware](https://learn.microsoft.com/en-us/agent-framework/journey/adding-middleware),
  2026.
- [Microsoft Human-in-the-Loop with AG-UI](https://learn.microsoft.com/en-us/agent-framework/integrations/ag-ui/human-in-the-loop),
  2026.
- [Google, How Google secures AI Agents](https://cloud.google.com/blog/products/identity-security/cloud-ciso-perspectives-how-google-secures-ai-agents/),
  2025.
- [Google, What's new in IAM: Security, governance, and runtime defense](https://cloud.google.com/blog/products/identity-security/whats-new-in-iam-security-governance-and-runtime-defense),
  2026.
- [NIST AI RMF Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence),
  2024.
- [Yang, AgentTrust: Runtime Safety Evaluation and Interception for AI Agent Tool Use](https://arxiv.org/abs/2605.04785),
  2026-05-06.
