import type { Opportunity, OpportunityAction } from "./domain.js";

export type PolicyDecision = "allow" | "warn" | "block" | "review";

export type ActionPolicyResult = {
  decision: PolicyDecision;
  reasons: string[];
};

export class ApprovalRequiredError extends Error {
  constructor(public readonly reasons: string[]) {
    super("Action requires explicit user approval.");
  }
}

export function evaluateOpportunityAction(
  opportunity: Opportunity,
  action: OpportunityAction,
): ActionPolicyResult {
  if (opportunity.source === "job_aggregation") {
    return { decision: "block", reasons: ["source is a job aggregation record"] };
  }
  if (action === "apply") {
    if (opportunity.source !== "direct_job" || !opportunity.evidence?.applicationUrl) {
      return { decision: "block", reasons: ["apply requires a verified application URL"] };
    }
    return { decision: "review", reasons: ["application action requires user approval"] };
  }
  if (action === "contribute" && opportunity.kind !== "oss") {
    return { decision: "block", reasons: ["contribute requires an open-source opportunity"] };
  }
  return { decision: "allow", reasons: ["action is read-only or contribution-focused"] };
}
