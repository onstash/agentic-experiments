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
  query = "",
): RankedOpportunity[] {
  const terms = [...profile.skills, ...profile.interests, ...profile.targetRoles].map(normalize);
  const queryTerms = tokenize(query);
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
      const matchedQueryTerms = queryTerms.filter((term) => text.includes(term));
      const freshness = freshnessScore(opportunity.updatedAt);
      const effort = effortScore(opportunity);
      const credibility = credibilityScore(opportunity);
      const statePenalty = opportunity.issue?.state === "closed" ? -3 : 0;
      const score = Math.min(
        10,
        Math.max(
          0,
          matchedSkills.length * 1.5 +
            matchedQueryTerms.length +
            freshness +
            effort +
            credibility +
            statePenalty,
        ),
      );
      return {
        ...opportunity,
        score,
        matchedSkills: [...new Set(matchedSkills)],
        reasons: [
          matchedSkills.length ? "matches profile interests or skills" : "broad query match",
          matchedQueryTerms.length ? "matches the search query" : "weak query match",
          freshness >= 2 ? "recently updated" : "older update",
          effort >= 1
            ? "has an approachable contribution signal"
            : "may require substantial effort",
          credibility >= 1 ? "has a credible repository signal" : "limited repository signal",
          ...(statePenalty ? ["closed issue"] : []),
        ],
      };
    })
    .sort((a, b) => b.score - a.score);
}
function tokenize(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter((term) => term.length > 2);
}

function freshnessScore(value: string): number {
  const age = daysSince(value);
  if (age < 30) return 2;
  if (age < 120) return 1;
  return 0;
}

function effortScore(opportunity: Opportunity): number {
  const labels = opportunity.issue?.labels.map(normalize) ?? [];
  const text = normalize(`${opportunity.title} ${opportunity.summary}`);
  if (labels.includes("good first issue")) return 2;
  if (labels.includes("help wanted")) return 1.5;
  if (/documentation|docs|typo|example|error message/.test(text)) return 1;
  if (/refactor|redesign|architecture|breaking change/.test(text)) return 0;
  return 0.5;
}

function credibilityScore(opportunity: Opportunity): number {
  if (opportunity.kind !== "oss") return 0.5;
  const stars = opportunity.repository.stars ?? 0;
  if (stars >= 5000) return 1;
  if (stars >= 500) return 0.5;
  return 0;
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
