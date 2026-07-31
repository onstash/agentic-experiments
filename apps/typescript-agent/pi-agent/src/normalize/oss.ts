import type { Opportunity, ScoredSourceHit } from "../types.js";

import { scoreRelevance } from "../scoring/relevance.js";
import type { UserProfile } from "../profile.js";

export type RawOssHit = {
  repoName: string;
  repoUrl: string;
  repoOwner: string;
  issueTitle?: string;
  issueBody?: string;
  labels: string[];
  stars: number;
  updatedAt: string;
  topics: string[];
};

function scoreRecency(_updatedAt: string): number {
  return 5;
}

function scoreOssEffort(labels: string[]): number {
  const lowered = labels.map((label) => label.toLowerCase());
  if (lowered.includes("good first issue")) return 9;
  if (lowered.includes("help wanted")) return 7;
  return 5;
}

function scoreOssConfidence(stars: number): number {
  if (stars >= 5000) return 9;
  if (stars >= 500) return 7;
  if (stars >= 50) return 6;
  return 4;
}

export function normalizeOss(
  scoredHit: ScoredSourceHit<RawOssHit>,
  profile: UserProfile,
): Opportunity {
  const { hit, queryScore } = scoredHit;
  return {
    kind: "oss",
    title: hit.issueTitle ?? hit.repoName,
    url: hit.repoUrl,
    organization: hit.repoOwner,
    summary: hit.issueBody ?? `Contribute to ${hit.repoName}`,
    topics: [...hit.topics, ...hit.labels],
    queryScore,
    relevanceScore: scoreRelevance([...hit.topics, ...hit.labels], profile),
    recencyScore: scoreRecency(hit.updatedAt),
    effortScore: scoreOssEffort(hit.labels),
    confidenceScore: scoreOssConfidence(hit.stars),
  };
}
