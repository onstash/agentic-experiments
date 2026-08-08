export type OpportunityKind = "oss" | "job";
export type OpportunitySource = "github_issue" | "github_discussion" | "job_board";
export type Opportunity = {
  kind: OpportunityKind;
  title: string;
  url: string;
  summary: string;
  repository: {
    owner: string;
    name: string;
    url: string;
    stars?: number;
  };
  issue?: {
    number: number;
    state: "open" | "closed";
    labels: string[];
    comments: number;
    authorAssociation?: string;
  };
  topics: string[];
  updatedAt: string;
  createdAt?: string;
  source: OpportunitySource;
};
export type RankedOpportunity = Opportunity & {
  score: number;
  matchedSkills: string[];
  reasons: string[];
};

export function rank(
  opportunities: Opportunity[],
  profile: { skills: string[]; interests: string[]; targetRoles: string[] },
): RankedOpportunity[] {
  const terms = [...profile.skills, ...profile.interests, ...profile.targetRoles].map(normalize);
  return opportunities
    .map((opportunity) => {
      const text = normalize(
        [
          opportunity.title,
          opportunity.summary,
          opportunity.repository.owner,
          opportunity.repository.name,
          ...opportunity.topics,
        ].join(" "),
      );
      const matchedSkills = terms.filter((term) => text.includes(term));
      const freshness = daysSince(opportunity.updatedAt) < 30 ? 2 : 0;
      const score = Math.min(
        10,
        matchedSkills.length * 1.5 +
          freshness +
          (opportunity.kind === "oss" &&
          opportunity.repository.stars &&
          opportunity.repository.stars > 1000
            ? 1
            : 0),
      );
      return {
        ...opportunity,
        score,
        matchedSkills: [...new Set(matchedSkills)],
        reasons: [
          matchedSkills.length ? "matches profile interests or skills" : "broad query match",
          freshness ? "recently updated" : "older update",
        ],
      };
    })
    .sort((a, b) => b.score - a.score);
}
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function daysSince(value: string): number {
  const time = Date.parse(value);
  return Number.isFinite(time) ? (Date.now() - time) / 86_400_000 : Number.POSITIVE_INFINITY;
}
