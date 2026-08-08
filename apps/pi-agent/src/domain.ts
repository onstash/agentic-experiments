export type OpportunityKind = "oss" | "job";
export type OpportunitySource = "github_issue" | "github_discussion" | "job_board";
export type OpportunityQuality = "actionable" | "stale" | "duplicate" | "too_broad" | "blocked";
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
  quality: OpportunityQuality;
  qualityReasons: string[];
};

export function classifyOpportunity(
  opportunity: Opportunity,
  now = new Date(),
): {
  quality: OpportunityQuality;
  qualityReasons: string[];
} {
  const labels = opportunity.issue?.labels.map(normalize) ?? [];
  const text = normalize(`${opportunity.title} ${opportunity.summary}`);

  if (labels.includes("duplicate") || text.includes("duplicate")) {
    return { quality: "duplicate", qualityReasons: ["marked or described as a duplicate"] };
  }
  if (opportunity.issue?.state === "closed") {
    return { quality: "blocked", qualityReasons: ["issue is closed"] };
  }
  if (/architecture|redesign|rewrite|entire system|breaking change/.test(text)) {
    return { quality: "too_broad", qualityReasons: ["scope appears broad or architectural"] };
  }
  if (daysSince(opportunity.updatedAt, now) > 180) {
    return { quality: "stale", qualityReasons: ["issue has not been updated recently"] };
  }
  return { quality: "actionable", qualityReasons: ["issue is open and has a current task"] };
}

export function rank(
  opportunities: Opportunity[],
  profile: { skills: string[]; interests: string[]; targetRoles: string[]; excludedTerms?: string[]; preferredEffort?: "low" | "medium" | "high" },
  query = "",
): RankedOpportunity[] {
  const terms = expandTerms([...profile.skills, ...profile.interests, ...profile.targetRoles]);
  const { included: queryTerms, excluded: queryExclusions } = normalizeQuery(query);
  const exclusions = [...(profile.excludedTerms ?? []), ...queryExclusions].map(normalize);
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
      const excluded = exclusions.some((term) => term && text.includes(term));
      const matchedSkills = terms.filter((term) => text.includes(term));
      const matchedQueryTerms = queryTerms.filter((term) => text.includes(term));
      const freshness = freshnessScore(opportunity.updatedAt);
      const effort = effortScore(opportunity, profile.preferredEffort);
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
            statePenalty - (excluded ? 10 : 0),
        ),
      );
      const quality = classifyOpportunity(opportunity);
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
          ...(excluded ? ["matches an excluded term"] : []),
        ],
        ...quality,
      };
    })
    .sort((a, b) => b.score - a.score);
}
export function normalizeQuery(value: string): { included: string[]; excluded: string[] } {
  const tokens = normalize(value).split(" ").filter((term) => term.length >= 2);
  const excluded: string[] = [];
  const included: string[] = [];
  let excluding = false;
  for (const token of tokens) {
    if (token === "not" || token === "without" || token === "excluding") {
      excluding = true;
      continue;
    }
    (excluding ? excluded : included).push(token);
  }
  return { included, excluded };
}

const aliases: Record<string, string[]> = {
  js: ["javascript"], ts: ["typescript"], reactjs: ["react"], ai: ["artificial intelligence"],
};
function expandTerms(values: string[]): string[] {
  return [...new Set(values.flatMap((value) => [normalize(value), ...(aliases[normalize(value)] ?? [])]).filter(Boolean))];
}

function freshnessScore(value: string): number {
  const age = daysSince(value);
  if (age < 30) return 2;
  if (age < 120) return 1;
  return 0;
}

function effortScore(opportunity: Opportunity, preferredEffort?: "low" | "medium" | "high"): number {
  const labels = opportunity.issue?.labels.map(normalize) ?? [];
  const text = normalize(`${opportunity.title} ${opportunity.summary}`);
  if (labels.includes("good first issue")) return preferredEffort === "high" ? 1 : 2;
  if (labels.includes("help wanted")) return 1.5;
  if (/documentation|docs|typo|example|error message/.test(text)) return 1;
  if (/refactor|redesign|architecture|breaking change/.test(text)) return preferredEffort === "high" ? 1 : 0;
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
function daysSince(value: string, now = new Date()): number {
  const time = Date.parse(value);
  return Number.isFinite(time) ? (now.getTime() - time) / 86_400_000 : Number.POSITIVE_INFINITY;
}
