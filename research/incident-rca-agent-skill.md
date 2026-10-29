# Incident RCA and postmortem practices for a reusable Agent Skill

- **Research date:** 2026-10-29
- **Scope:** Root-cause analysis (RCA), incident analysis, postmortems, and the boundary between deterministic tooling and agent reasoning.
- **Source rule:** This note uses first-party sources from Google SRE, NIST, AWS, and PagerDuty. Recommendations marked **Design inference** are a synthesis for an Agent Skill, not a claim that a source defines a universal standard.

## Executive synthesis

A reusable incident-analysis skill should be an evidence-first pipeline:

1. Preserve raw records and build a source-linked timeline.
2. Separate customer impact, observable symptoms, trigger, contributing factors, systemic root causes, and unresolved questions.
3. Treat each causal statement as a hypothesis supported by evidence, not as a fact because it is plausible.
4. Turn findings into owned, prioritized, tracked actions with a measurable proof of completion.
5. Add prevention, detection, mitigation, and preparedness guardrails.
6. Keep the report blameless, reviewable, and useful to people outside the immediate team.

This shape is consistent across the sources. Google defines a root cause as a defect whose repair creates confidence that the same event will not recur in the same way, and allows one incident to have multiple root causes. NIST asks responders to establish the event sequence, involved assets, and underlying or systemic causes. AWS asks teams to identify contributing factors and preventive actions, and to verify that actions were implemented. ([Google SRE monitoring](https://sre.google/sre-book/monitoring-distributed-systems/); [NIST SP 800-61 Rev. 3, RS.AN-03](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf); [AWS REL12-BP02](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_testing_resiliency_rca_resiliency.html))

## Source-backed practices

### 1. Reconstruct evidence before explaining it

The primary record should distinguish an observed fact from an interpretation. NIST’s incident-analysis guidance calls for the sequence of events and the assets or resources involved in each event. It also requires records, incident data, metadata, integrity, and provenance to be preserved. ([NIST SP 800-61 Rev. 3, RS.AN-03 and RS.AN-06/07](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf))

NIST’s forensic guidance adds important detail for timeline reconstruction: electronic records can be altered, major events and actions should be recorded, file times must be preserved when an accurate timeline matters, and copied evidence should be checked for integrity. It describes collection, examination, analysis, and reporting as separate phases. ([NIST SP 800-86, sections 2.1, 2.4, 3, and 4.2.3](https://nvlpubs.nist.gov/nistpubs/legacy/sp/nistspecialpublication800-86.pdf))

Google recommends a living incident document during response and retaining it for postmortem analysis. Its postmortem tooling collects incident roles, detailed timelines, logs, affected services, severity, and detection mechanisms. PagerDuty’s owned template makes the timeline the initial focus, requires a data link for each important timestamp, and records the commands or queries used to gather the facts. ([Google SRE managing incidents](https://sre.google/sre-book/managing-incidents/); [Google SRE Workbook postmortem culture](https://sre.google/workbook/postmortem-culture/); [PagerDuty postmortem process](https://response.pagerduty.com/after/post_mortem_process/))

**Design inference:** The skill should create an evidence ledger before it writes prose. Each row should contain:

```text
event_id
event_time
timezone
observed_event
source_type
source_link_or_query
raw_artifact_reference
evidence_status: observed | derived | disputed | missing
confidence: confirmed | strongly_supported | plausible | unresolved
notes
```

Do not silently replace missing evidence with a guessed timestamp. Keep the raw record, normalized record, and interpretation separate. If sources disagree, preserve both observations and explain the reconciliation.

### 2. Separate symptoms from causes, and triggers from systemic causes

Google makes a direct distinction: “what is broken” is the symptom and “why” is a cause. A symptom at one layer can be a cause at another layer. Google also recommends symptom-oriented alerting because alerting should detect customer impact; internal telemetry is then needed to debug the cause. ([Google SRE monitoring, “Symptoms Versus Causes”](https://sre.google/sre-book/monitoring-distributed-systems/); [Google Incident Management Guide](https://sre.google/resources/practices-and-processes/incident-management-guide/))

NIST separates the event sequence from the search for vulnerabilities, threats, and underlying or systemic root causes. Google’s example postmortem records root causes and the trigger as different fields. AWS warns against stopping at a contributing factor or an immediate technical failure. ([NIST SP 800-61 Rev. 3](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf); [Google example postmortem](https://sre.google/sre-book/example-postmortem/); [AWS REL12-BP02](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_testing_resiliency_rca_resiliency.html))

The report should therefore use these separate fields:

| Field | Meaning | Typical evidence |
| --- | --- | --- |
| Impact | What users, systems, or business outcomes experienced | SLOs, customer metrics, data-loss counts |
| Symptom | What was observable and triggered detection | User reports, black-box checks, alerts |
| Trigger | The event that activated a latent weakness | Deployment, traffic spike, config change |
| Contributing factor | A condition that increased likelihood or blast radius | Missing test, unsafe default, dependency behavior |
| Systemic root cause | A defect whose repair materially reduces recurrence risk | Design, process, tooling, or control gap |
| Mitigation | What reduced impact during the incident | Rollback, traffic shift, rate limit |
| Unknown | A material question not established by evidence | Missing logs, untested alternative hypothesis |

This prevents “the database returned errors” from being reported as the root cause when it is only the symptom or an intermediate cause.

### 3. Make uncertainty explicit

Google’s troubleshooting method uses hypotheses and tests. It warns that correlation is not causation, that some tests are only suggestive, and that real systems often have multiple interacting factors. It requires notes about the ideas considered, tests run, and results, including negative results. ([Google SRE effective troubleshooting](https://sre.google/sre-book/effective-troubleshooting/))

AWS CloudWatch’s incident-report guidance gives a useful model for agent output: distinguish fact-based findings from inference-based suggestions, show supporting evidence, validate each answer, and treat AI-derived findings as requiring human verification in critical decisions. It also calls out hidden variables, incomplete telemetry, and the difference between correlation and causation. ([AWS CloudWatch incident-report terminology](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Investigations-IncidentReports-terms.html); [AWS CloudWatch AI-derived facts](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Investigations-IncidentReports-ai-facts.html))

**Design inference:** Do not force a numeric probability when the evidence does not support one. Use a qualitative confidence label plus an evidence ledger and a counter-hypothesis. A causal claim is not “confirmed” until the skill can state:

- what observation supports it;
- what observation would disconfirm it;
- what alternative explanations were considered;
- what test or change was run;
- whether the result was definitive or only suggestive; and
- what remains unknown.

The skill should downgrade confidence when telemetry is incomplete, the claim is based only on correlation, a test has confounding factors, or the cause cannot be reproduced. A report can say “probable cause” or “unresolved” without being incomplete; that is more honest than inventing certainty.

### 4. Use 5 Whys as a flexible probe, not as a ritual

AWS’s own Five Whys guidance says that teams may need more than five questions, should ask whether a cause could have been prevented or detected, and should treat “human error” as a signal to ask why the error was possible. It also says to stop when the team is confident that it found the root causes. ([AWS Well-Architected Five Whys](https://wa.aws.amazon.com/wellarchitected/2020-07-02T19-33-23/wat.concept.fivewhys.en.html))

AWS CloudWatch extends this method for complex incidents: branch when there are independent failures, different components, technical and process causes, or cascading chains; connect the branches; and use metrics, logs, and timeline events to validate each answer. Its stated pitfalls include stopping at symptoms, single-path thinking, and insufficient evidence. ([AWS CloudWatch 5 Whys](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/incident-report-5whys.html))

Google likewise says teams use different RCA methods and choose one suited to the service. Its example postmortem says 5 Whys can help explain contributing factors, but judgment is still needed; its troubleshooting chapter warns against a single root cause when several factors interact. ([Google SRE postmortem culture](https://sre.google/sre-book/postmortem-culture/); [Google example postmortem](https://sre.google/sre-book/example-postmortem/); [Google SRE effective troubleshooting](https://sre.google/sre-book/effective-troubleshooting/))

**Skill rule:** ask “why?” until the causal link is evidenced and the next prevention decision is clear. Branch instead of forcing one chain. Stop based on evidence and confidence, not because the counter reached five. If the chain ends in “a person made a mistake,” continue to examine interface design, defaults, review, training, escalation, automation, and fail-safe controls.

### 5. Make corrective actions concrete and prove them

Google’s postmortem examples define a strong action item as one with an owner, priority, tracking identifier, and verifiable end state. They separate prevent, mitigate, detect, repair, and process work. Google also warns that “make humans less error-prone” is weaker than changing automated systems and processes. ([Google SRE Workbook postmortem culture](https://sre.google/workbook/postmortem-culture/); [Google example postmortem](https://sre.google/sre-book/example-postmortem/))

AWS requires teams to create checklists and track actions, identify who owns the improvement plan, and state how implementation will be tested. AWS also recommends post-incident metrics for deployment, alarm, engagement, mitigation, and resolution timepoints. ([AWS OPS11-BP02](https://docs.aws.amazon.com/wellarchitected/2024-06-27/framework/ops_evolve_ops_perform_rca_process.html); [AWS Incident Manager post-incident analysis](https://docs.aws.amazon.com/incident-manager/latest/userguide/analysis.html))

NIST requires recovery verification, including the integrity and correctness of restored assets, remediation of root causes before production use, and an after-action report containing the incident, response/recovery actions, and lessons learned. ([NIST SP 800-61 Rev. 3, RC.RP-03 through RC.RP-06](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf))

**Minimum action schema:**

```text
action_id
category: detect | mitigate | prevent | prepare | process
problem_or_causal_edge_addressed
owner
priority
tracking_reference
due_or_review_date
acceptance_criterion
verification_method
verification_artifact
status
residual_risk
```

An action is not complete because a ticket says “done.” The proof should show the changed behavior: a regression test, guardrail check, canary result, alert firing test, controlled failure exercise, metric trend, or documented runbook exercise. If no proof is possible, the action remains an open risk and the report should say so.

### 6. Prefer system guardrails over reminders

The sources repeatedly shift the focus from individual behavior to system design. Google recommends fixing the environment and automatically validating dangerous operational decisions. AWS lists training-only or human-error-only explanations as an anti-pattern and recommends automation or guardrails. AWS’s operational-excellence guidance recommends runbooks for well-understood events and scripted responses that can be automated from monitoring data. ([Google SRE service best practices](https://sre.google/sre-book/service-best-practices/); [AWS REL12-BP02](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_testing_resiliency_rca_resiliency.html); [AWS Operate](https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/operate.html))

For each corrective action, ask in this order:

1. Can the unsafe state be rejected automatically?
2. Can detection happen earlier and reach the right owner?
3. Can mitigation reduce blast radius or make rollback safe?
4. Can a runbook or script make the response repeatable?
5. Is training still needed after the system controls are improved?

This does not make training useless. It prevents training from becoming the only control for a predictable failure mode.

### 7. Blameless does not mean vague

Google defines a blameless postmortem as one that identifies contributing causes without indicting a person or team. It assumes people acted with good intent and the information available at the time. Google’s writing guidance calls for factual language, data-linked conclusions, multiple perspectives, and system-focused actions. AWS and PagerDuty also require blame-free analysis. ([Google SRE postmortem culture](https://sre.google/sre-book/postmortem-culture/); [AWS Incident Manager post-incident analysis](https://docs.aws.amazon.com/incident-manager/latest/userguide/analysis.html); [PagerDuty postmortem process](https://response.pagerduty.com/after/post_mortem_process/))

The agent should describe decisions in context: what the responder knew, what the system exposed, which procedure existed, and what constraints applied. It should name the action or system state when needed, but avoid judgmental labels such as “careless,” “ignored,” or “failed to understand.” Blameless writing still needs precise facts, causal depth, and accountable owners for follow-up work.

## Deterministic work versus agent reasoning

The boundary should follow repeatability and risk. Google and AWS both recommend automating common or well-understood response work, while Google’s troubleshooting guidance requires hypothesis testing and judgment. AWS CloudWatch describes AI findings as starting points that need human verification. ([Google Incident Management Guide](https://sre.google/resources/practices-and-processes/incident-management-guide/); [AWS Operate](https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/operate.html); [Google SRE effective troubleshooting](https://sre.google/sre-book/effective-troubleshooting/); [AWS CloudWatch AI-derived facts](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Investigations-IncidentReports-ai-facts.html))

| Deterministic scripts should do | Agent reasoning should do | Required boundary |
| --- | --- | --- |
| Fetch allowed logs, metrics, deploys, tickets, chat exports, and runbook records | Decide which sources are relevant and what is still missing | Never invent a source or silently discard a conflict |
| Normalize timestamps, time zones, IDs, and units | Reconcile conflicting observations and explain the uncertainty | Preserve raw values and the transformation |
| Extract event candidates and calculate detection, mitigation, resolution, and recovery durations | Decide which events changed the causal story | Link every important event to evidence |
| Preserve artifacts, hashes, provenance, queries, and command output | Judge whether evidence supports a causal edge | Mark correlation as correlation until tested |
| Validate required report fields and action-item fields | Separate symptom, trigger, contributor, systemic cause, and unknown | Allow multiple causes and branches |
| Create or update tracking records only when authorized | Propose actions and rank prevention, detection, mitigation, and preparedness options | Do not execute impactful changes from an unverified hypothesis |
| Run regression tests, alert tests, canaries, failure exercises, and post-change checks | Interpret whether the proof addresses recurrence risk and residual risk | Record pass, fail, scope, and limitations |
| Check that action owners, status, due dates, and proof artifacts exist | Write a clear, blameless narrative for review | Human review remains the approval boundary |

**Design inference:** Scripts should enforce evidence and completeness; the agent should produce competing explanations, make uncertainty visible, and propose the smallest useful next test. The agent may draft conclusions, but it should not convert a hypothesis into a production change merely because the narrative sounds coherent.

## Proposed Agent Skill workflow and output contract

### Workflow

1. **Declare scope and sources.** Record incident ID, affected system, time window, authorized data sources, and privacy limits.
2. **Freeze and inventory evidence.** Preserve raw artifacts, queries, command output, and provenance. Record missing or inaccessible sources.
3. **Build the timeline.** Normalize times but retain original timestamps and time zones. Include impact start, detection, alert, engagement, diagnosis, mitigation, recovery, and closure.
4. **Quantify impact.** Use customer and business outcomes, with a stated estimate and measurement method. Google notes that an estimate is better than no data, but the skill must label it as an estimate. ([Google SRE Workbook postmortem culture](https://sre.google/workbook/postmortem-culture/))
5. **Classify the causal model.** Record symptoms, trigger, intermediate causes, contributing factors, systemic root causes, mitigations, and unknowns.
6. **Test hypotheses.** Use 5 Whys, fault trees, timelines, dependency analysis, or another method suited to the incident. Branch when causes are independent or interacting. Record disconfirming tests and negative results.
7. **Assign confidence.** Attach evidence and counterevidence to every important causal claim. Use qualitative labels. Do not claim certainty where tests are suggestive or telemetry is incomplete.
8. **Design actions.** For each causal edge, create detect, mitigate, prevent, prepare, and process options. Select actions with owners, priorities, tracking IDs, acceptance criteria, and verification methods.
9. **Verify the fix.** Run the smallest safe proof. Check both the targeted failure mode and customer-facing behavior. Record residual risk and limits of the test.
10. **Review and share.** Run a blameless technical review, correct unsupported claims, protect sensitive data, publish the lessons to the intended audience, and keep actions tracked until their proof is complete. ([NIST SP 800-61 Rev. 3](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf); [AWS OPS11-BP08](https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_evolve_ops_share_lessons_learned.html))

### Minimum report shape

```text
Incident overview
Impact and measurement method
Detection and response summary
Evidence ledger
Timeline with source links
Symptoms and customer-visible behavior
Trigger
Contributing factors
Systemic root causes
Competing hypotheses and unresolved questions
Mitigation and recovery
Corrective actions with owners and proof obligations
Prevention and guardrails
What went well / what did not / where we got lucky
Residual risk and follow-up review date
Supporting artifacts
```

This shape combines Google’s example postmortem fields, NIST’s incident-analysis and recovery requirements, AWS’s metrics/timeline/questions/actions flow, and PagerDuty’s evidence-linked timeline and action-item template. ([Google example postmortem](https://sre.google/sre-book/example-postmortem/); [NIST SP 800-61 Rev. 3](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf); [AWS Incident Manager analysis](https://docs.aws.amazon.com/incident-manager/latest/userguide/analysis.html); [PagerDuty postmortem template](https://response.pagerduty.com/after/post_mortem_template/))

## Anti-patterns the skill should reject

- **Symptom as root cause:** “The database failed” with no causal evidence or deeper system condition.
- **One-chain RCA:** A single five-step chain when the incident has independent, interacting, or cascading causes.
- **Cargo-cult five:** Stopping at exactly five questions, or continuing mechanically after the evidence and prevention decision are already clear.
- **Correlation as causation:** A graph that looks aligned but has no test, counterfactual, or corroborating evidence.
- **Human-error endpoint:** “Someone made a mistake” without examining defaults, interfaces, review, escalation, automation, or fail-safe controls.
- **Vague action:** “Improve monitoring” without an owner, priority, tracking reference, and measurable end state.
- **Unverified closure:** Calling an incident or action complete without a customer-facing check, regression test, canary, exercise, or other proof.
- **Blameful narrative:** Naming a person as the cause, using judgmental language, or omitting the information and constraints available at the time.
- **Evidence destruction:** Editing the only copy of raw logs, losing the original time zone, or failing to preserve provenance and integrity.

These rejection rules are direct applications of the Google, NIST, AWS, and PagerDuty practices cited above. They should be implemented as deterministic validators where possible and as explicit review prompts where judgment is required.

## Primary sources

- [Google SRE Book — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Google SRE Book — Effective Troubleshooting](https://sre.google/sre-book/effective-troubleshooting/)
- [Google SRE Book — Managing Incidents](https://sre.google/sre-book/managing-incidents/)
- [Google SRE Book — Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)
- [Google SRE Workbook — Postmortem Culture](https://sre.google/workbook/postmortem-culture/)
- [Google SRE Book — Example Postmortem](https://sre.google/sre-book/example-postmortem/)
- [Google Incident Management Guide](https://sre.google/resources/practices-and-processes/incident-management-guide/)
- [NIST SP 800-61 Rev. 3](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf)
- [NIST SP 800-86](https://nvlpubs.nist.gov/nistpubs/legacy/sp/nistspecialpublication800-86.pdf)
- [AWS REL12-BP02 — Perform post-incident analysis](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_testing_resiliency_rca_resiliency.html)
- [AWS OPS11-BP02 — Perform post-incident analysis](https://docs.aws.amazon.com/wellarchitected/2024-06-27/framework/ops_evolve_ops_perform_rca_process.html)
- [AWS Incident Manager — Performing a post-incident analysis](https://docs.aws.amazon.com/incident-manager/latest/userguide/analysis.html)
- [AWS Well-Architected — Five Whys](https://wa.aws.amazon.com/wellarchitected/2020-07-02T19-33-23/wat.concept.fivewhys.en.html)
- [AWS CloudWatch — Using 5 Whys analysis in incident reports](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/incident-report-5whys.html)
- [AWS CloudWatch — Incident report terminology](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Investigations-IncidentReports-terms.html)
- [AWS CloudWatch — Understanding AI-derived facts](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Investigations-IncidentReports-ai-facts.html)
- [AWS Operational Excellence — Operate](https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/operate.html)
- [AWS Operational Excellence — Validate insights](https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_evolve_ops_validate_insights.html)
- [AWS Operational Excellence — Document and share lessons learned](https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_evolve_ops_share_lessons_learned.html)
- [PagerDuty Incident Response — Postmortem Process](https://response.pagerduty.com/after/post_mortem_process/)
- [PagerDuty Incident Response — Postmortem Template](https://response.pagerduty.com/after/post_mortem_template/)
