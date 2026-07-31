import type { Opportunity, ScoredSourceHit } from "../types.js";

import { scoreRelevance } from "../scoring/relevance.js";
import type { UserProfile } from "../profile.js";

export type RawJobHit = {
  orgName: string;
  postingUrl: string;
  roleTitle: string;
  summary: string;
  skills: string[];
  updatedAt: string;
  source: "official_org" | "repo_issue" | "discussion";
};

function scoreRecency(_updatedAt: string): number {
  return 5;
}

function scoreJobEffort(_summary: string): number {
  return 5;
}

function scoreJobConfidence(source: RawJobHit["source"]): number {
  if (source === "official_org") return 9;
  if (source === "repo_issue") return 7;
  return 5;
}

export function normalizeJob(
  scoredHit: ScoredSourceHit<RawJobHit>,
  profile: UserProfile,
): Opportunity {
  const { hit, queryScore } = scoredHit;
  return {
    kind: "job",
    title: hit.roleTitle,
    url: hit.postingUrl,
    organization: hit.orgName,
    summary: hit.summary,
    topics: hit.skills,
    queryScore,
    relevanceScore: scoreRelevance(hit.skills, profile),
    recencyScore: scoreRecency(hit.updatedAt),
    effortScore: scoreJobEffort(hit.summary),
    confidenceScore: scoreJobConfidence(hit.source),
  };
}
