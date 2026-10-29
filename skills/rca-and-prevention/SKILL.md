---
name: rca-and-prevention
description: Produce an evidence-first, blameless root-cause analysis with corrective actions and proof obligations.
---

# RCA and prevention

Use `research/incident-rca-agent-skill.md` as the method reference.

## Workflow

1. Declare scope, time window, sources, and privacy limits.
2. Preserve raw evidence and build a source-linked timeline.
3. Separate impact, symptom, trigger, contributing factors, systemic causes, mitigations, and unknowns.
4. Record competing hypotheses and disconfirming tests.
5. Assign qualitative confidence supported by evidence; do not invent percentages.
6. Propose no more than five prioritized solutions unless the user requests more.
7. Give each solution an owner, acceptance criterion, and objective proof.
8. Prefer deterministic guardrails, tests, and monitoring over reminders.
9. State residual risk and unresolved questions.

Five Whys is a probe, not a fixed ritual. Branch for interacting causes and continue past human
error to the system conditions that allowed it.
