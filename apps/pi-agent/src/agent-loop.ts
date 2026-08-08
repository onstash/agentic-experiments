import type { Opportunity, RankedOpportunity } from "./domain.js";
import type { OpportunityProfile } from "./profile.js";
import type { RecommendationDocument } from "./pi-runtime.js";
import { deriveQueries, type PlannedQuery } from "./query-plan.js";

export type AgentLoopDependencies = {
  search: (query: string) => Promise<Opportunity[]>;
  rank: (
    opportunities: Opportunity[],
    profile: OpportunityProfile,
    query: string,
  ) => RankedOpportunity[];
  recommend?: (
    profile: OpportunityProfile,
    query: string,
    opportunities: RankedOpportunity[],
  ) => Promise<RecommendationDocument>;
};

export type AgenticRunEvent = {
  step: "plan" | "search" | "rank" | "stop" | "recommend";
  status: "started" | "completed" | "failed";
  iteration: number;
  query?: string;
  count?: number;
  reason?: string;
  error?: string;
  metadata?: AgentRunMetadata;
};

export type AgenticRunResult = {
  metadata: AgentRunMetadata;
  queries: PlannedQuery[];
  opportunities: RankedOpportunity[];
  recommendation?: RecommendationDocument;
  events: AgenticRunEvent[];
};

export type AgentRunMetadata = {
  runId: string;
  policyVersion: string;
  promptVersion: string;
  schemaVersion: string;
};

export async function runAgenticOpportunitySearch(
  profile: OpportunityProfile,
  query: string | undefined,
  dependencies: Pick<AgentLoopDependencies, "search" | "rank" | "recommend">,
  options: { maxQueries: number; metadata?: Partial<AgentRunMetadata>; onEvent?: (event: AgenticRunEvent) => void },
): Promise<AgenticRunResult> {
  if (!Number.isInteger(options.maxQueries) || options.maxQueries < 1) throw new Error("maxQueries must be a positive integer.");
  const queries = query?.trim() ? [{ priority: 1, query: query.trim(), reason: "User supplied query." }] : deriveQueries(profile, options.maxQueries);
  const metadata: AgentRunMetadata = {
    runId: options.metadata?.runId ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    policyVersion: options.metadata?.policyVersion ?? "1",
    promptVersion: options.metadata?.promptVersion ?? "1",
    schemaVersion: options.metadata?.schemaVersion ?? "1",
  };
  const queryTexts = queries.map((item) => item.query);
  const rankingQuery = queryTexts.join(" ");
  const recommendationQuery = queryTexts.join("; ");
  const events: AgenticRunEvent[] = [];
  const emit = (event: AgenticRunEvent) => {
    const enrichedEvent = { ...event, metadata };
    events.push(enrichedEvent);
    options.onEvent?.(enrichedEvent);
  };
  emit({ step: "plan", status: "started", iteration: 0, count: queries.length });
  emit({ step: "plan", status: "completed", iteration: 0, count: queries.length, reason: query ? "Using the user query." : "Derived queries from the profile." });
  const found: Opportunity[] = [];
  let ranked: RankedOpportunity[] = [];
  let completedIteration = 0;
  for (const [index, planned] of queries.entries()) {
    const iteration = index + 1;
    completedIteration = iteration;
    emit({ step: "search", status: "started", iteration, query: planned.query });
    let results: Opportunity[];
    try {
      results = await dependencies.search(planned.query);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Search failed.";
      emit({ step: "search", status: "failed", iteration, query: planned.query, error: message });
      emit({ step: "stop", status: "completed", iteration, count: ranked.length, reason: "Search failed after earlier results were collected." });
      break;
    }
    found.push(...results);
    emit({ step: "search", status: "completed", iteration, query: planned.query, count: found.length });
    emit({ step: "rank", status: "started", iteration, count: found.length });
    ranked = dependencies.rank(found, profile, rankingQuery);
    emit({ step: "rank", status: "completed", iteration, count: ranked.length });
    const actionable = ranked.filter((item) => item.quality === "actionable");
    if (index === queries.length - 1) {
      const reason = "Query limit reached.";
      emit({ step: "stop", status: "completed", iteration, count: actionable.length, reason });
      break;
    }
  }
  const opportunities = ranked.slice(0, 20);
  const actionableOpportunities = ranked
    .filter((item) => item.quality === "actionable" && item.source !== "job_aggregation")
    .slice(0, 20);
  let recommendation: RecommendationDocument | undefined;
  if (dependencies.recommend) {
    emit({ step: "recommend", status: "started", iteration: completedIteration });
    recommendation = await dependencies.recommend(profile, recommendationQuery, actionableOpportunities);
    emit({ step: "recommend", status: "completed", iteration: completedIteration });
  }
  return { metadata, queries, opportunities, recommendation, events };
}
