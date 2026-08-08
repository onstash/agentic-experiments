import type { Opportunity, RankedOpportunity } from "./domain.js";
import type { OpportunityProfile } from "./profile.js";

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
