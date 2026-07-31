import type { Opportunity, RankedOpportunity } from "../types.js";

export function totalScore(opportunity: Opportunity): number {
  return (
    opportunity.relevanceScore * 0.3 +
    opportunity.queryScore * 0.25 +
    opportunity.recencyScore * 0.15 +
    opportunity.effortScore * 0.15 +
    opportunity.confidenceScore * 0.15
  );
}

export function explain(opportunity: Opportunity): string[] {
  const reasons: string[] = [];

  if (opportunity.queryScore >= 2) reasons.push("strong query match");
  if (opportunity.relevanceScore >= 6) reasons.push("strong profile match");
  if (opportunity.recencyScore >= 7) reasons.push("fresh opportunity");
  if (opportunity.effortScore >= 7) reasons.push("approachable next step");
  if (opportunity.confidenceScore >= 7) reasons.push("credible source");

  return reasons;
}

export function rank(opportunities: Opportunity[]): RankedOpportunity[] {
  return opportunities
    .map((opportunity) => ({
      ...opportunity,
      totalScore: totalScore(opportunity),
      reasons: explain(opportunity),
    }))
    .sort((a, b) => b.totalScore - a.totalScore);
}
