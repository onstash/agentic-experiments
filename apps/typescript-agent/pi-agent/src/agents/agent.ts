import { normalizeJob } from "../normalize/jobs.js";
import { normalizeOss } from "../normalize/oss.js";
import type { UserProfile } from "../profile.js";
import type { RankedOpportunity } from "../types.js";
import { rank } from "../ranking/rank.js";
import { tools } from "../tools.js";
import type { SelectedModel } from "../models/default-model.js";
import { buildRuntimeInput, type RuntimeInput } from "../runtime.js";

export async function runOpportunityAgent(
  profile: UserProfile,
  userInput: string,
): Promise<{
  userInput: string;
  runtime: RuntimeInput;
  ranked: RankedOpportunity[];
}> {
  const runtime = buildRuntimeInput(userInput);
  const [rawJobHits, rawOssHits] = await Promise.all([
    tools.search_jobs.execute({ query: userInput }),
    tools.search_oss.execute({ query: userInput }),
  ]);

  const opportunities = [
    ...rawOssHits.map((hit) => normalizeOss(hit, profile)),
    ...rawJobHits.map((hit) => normalizeJob(hit, profile)),
  ];

  const ranked = rank(opportunities);
  return {
    userInput,
    runtime,
    ranked,
  };
}
