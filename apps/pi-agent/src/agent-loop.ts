import type { Opportunity, RankedOpportunity } from "./domain.js";
import type { OpportunityProfile } from "./profile.js";
import { deriveQueries, type PlannedQuery } from "./query-plan.js";

export type AgentStep = "search" | "rank" | "recommend";

export type AgentEvent = {
  step: AgentStep;
  iteration: number;
  status: "started" | "completed";
};

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
  ) => Promise<string>;
};

export type AgentLoopOptions = {
  maxIterations: number;
  onEvent?: (event: AgentEvent) => void;
};

export type AgentLoopResult = {
  opportunities: RankedOpportunity[];
  recommendation?: string;
  iterations: number;
  events: AgentEvent[];
};

export type AgenticRunEvent = {
  step: "plan" | "search" | "rank" | "stop" | "recommend";
  status: "started" | "completed";
  iteration: number;
  query?: string;
  count?: number;
  reason?: string;
};

export type AgenticRunResult = {
  queries: PlannedQuery[];
  opportunities: RankedOpportunity[];
  recommendation?: string;
  events: AgenticRunEvent[];
};

export async function runAgenticOpportunitySearch(
  profile: OpportunityProfile,
  query: string | undefined,
  dependencies: Pick<AgentLoopDependencies, "search" | "rank" | "recommend">,
  options: { maxQueries: number; onEvent?: (event: AgenticRunEvent) => void },
): Promise<AgenticRunResult> {
  if (!Number.isInteger(options.maxQueries) || options.maxQueries < 1) throw new Error("maxQueries must be a positive integer.");
  const queries = query?.trim() ? [{ priority: 1, query: query.trim(), reason: "User supplied query." }] : deriveQueries(profile, options.maxQueries);
  const events: AgenticRunEvent[] = [];
  const emit = (event: AgenticRunEvent) => { events.push(event); options.onEvent?.(event); };
  emit({ step: "plan", status: "started", iteration: 0, count: queries.length });
  emit({ step: "plan", status: "completed", iteration: 0, count: queries.length, reason: query ? "Using the user query." : "Derived queries from the profile." });
  const found: Opportunity[] = [];
  let ranked: RankedOpportunity[] = [];
  for (const [index, planned] of queries.entries()) {
    const iteration = index + 1;
    emit({ step: "search", status: "started", iteration, query: planned.query });
    found.push(...await dependencies.search(planned.query));
    emit({ step: "search", status: "completed", iteration, query: planned.query, count: found.length });
    emit({ step: "rank", status: "started", iteration, count: found.length });
    ranked = dependencies.rank(found, profile, queries.map((item) => item.query).join(" "));
    emit({ step: "rank", status: "completed", iteration, count: ranked.length });
    const actionable = ranked.filter((item) => item.quality === "actionable").length;
    if (actionable >= 3 || index === queries.length - 1) {
      const reason = actionable >= 3 ? "Enough actionable opportunities found." : "Query limit reached.";
      emit({ step: "stop", status: "completed", iteration, count: actionable, reason });
      break;
    }
  }
  const opportunities = ranked.slice(0, 20);
  let recommendation: string | undefined;
  if (dependencies.recommend) {
    emit({ step: "recommend", status: "started", iteration: queries.length });
    recommendation = await dependencies.recommend(profile, queries.map((item) => item.query).join("; "), opportunities);
    emit({ step: "recommend", status: "completed", iteration: queries.length });
  }
  return { queries, opportunities, recommendation, events };
}

export async function runOpportunityAgent(
  profile: OpportunityProfile,
  query: string,
  dependencies: AgentLoopDependencies,
  options: AgentLoopOptions,
): Promise<AgentLoopResult> {
  if (!Number.isInteger(options.maxIterations) || options.maxIterations < 1) {
    throw new Error("maxIterations must be a positive integer.");
  }

  const events: AgentEvent[] = [];
  const emit = (event: AgentEvent) => {
    events.push(event);
    options.onEvent?.(event);
  };
  const opportunities = await executeStep("search", 1, emit, () => dependencies.search(query));
  if (options.maxIterations === 1) {
    return { opportunities: [], iterations: 1, events };
  }

  const ranked = await executeStep("rank", 2, emit, () =>
    Promise.resolve(dependencies.rank(opportunities, profile, query)),
  );
  if (options.maxIterations === 2 || !dependencies.recommend) {
    return { opportunities: ranked, iterations: 2, events };
  }

  const recommendation = await executeStep("recommend", 3, emit, () =>
    dependencies.recommend!(profile, query, ranked),
  );
  return { opportunities: ranked, recommendation, iterations: 3, events };
}

async function executeStep<T>(
  step: AgentStep,
  iteration: number,
  emit: (event: AgentEvent) => void,
  action: () => Promise<T>,
): Promise<T> {
  emit({ step, iteration, status: "started" });
  const result = await action();
  emit({ step, iteration, status: "completed" });
  return result;
}
