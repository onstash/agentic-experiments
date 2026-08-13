import { loadProfile, parseProfileJson } from "./profile.js";
import { searchGithub } from "./github.js";
import { rank } from "./domain.js";
import { streamRecommendation } from "./pi-runtime.js";
import { checkEnv } from "./env.js";
import { loginCodex } from "./auth.js";
import { createPersistentPiSession } from "./pi-session.js";
import { runAgenticOpportunitySearch } from "./agent-loop.js";
import { createRunLogger } from "./run-log.js";
import { piAgentConfig } from "./config.js";

async function main() {
  checkEnv();
  const args = process.argv.slice(2);
  if (args[0] === "auth:login") {
    await loginCodex();
    return;
  }
  const fileIndex = args.indexOf("--profile");
  const jsonIndex = args.indexOf("--profile-json");
  const profile =
    fileIndex >= 0 && args[fileIndex + 1]
      ? await loadProfile(args[fileIndex + 1])
      : jsonIndex >= 0 && args[jsonIndex + 1]
        ? parseProfileJson(args[jsonIndex + 1])
        : undefined;
  if (profile) {
    const queryIndex = args.indexOf("--query");
    const query = queryIndex >= 0 ? args[queryIndex + 1] : undefined;
    const logIndex = args.indexOf("--log");
    const logPath =
      logIndex >= 0 && args[logIndex + 1] ? args[logIndex + 1] : `sessions/${Date.now()}.jsonl`;
    const iterationIndex = args.indexOf("--max-iterations");
    const maxIterations =
      iterationIndex >= 0 && Number.isInteger(Number(args[iterationIndex + 1]))
        ? Number(args[iterationIndex + 1])
        : piAgentConfig.maxIterations;
    const log = await createRunLogger(logPath);
    const result = await runAgenticOpportunitySearch(
      profile,
      query,
      {
        search: searchGithub,
        rank: (opportunities, currentProfile, currentQuery) =>
          rank(opportunities, currentProfile, currentQuery),
        recommend: args.includes("--stream")
          ? async (currentProfile, currentQuery, opportunities) => {
              const { session } = await createPersistentPiSession();
              try {
                return await streamRecommendation(
                  currentProfile,
                  currentQuery,
                  opportunities,
                  session,
                );
              } finally {
                session.dispose();
              }
            }
          : undefined,
      },
      {
        maxQueries: maxIterations,
        onEvent: (event) => {
          void log(event);
          if (!args.includes("--stream")) return;
          if (event.step === "plan" && event.status === "completed")
            console.log(`Planning ${event.count} queries...`);
          if (event.step === "search" && event.status === "started")
            console.log(`Searching query ${event.iteration}...`);
          if (event.step === "search" && event.status === "completed")
            console.log(`Found ${event.count} results.`);
          if (event.step === "search" && event.status === "failed")
            console.log(`Search stopped: ${event.error}`);
          if (event.step === "rank" && event.status === "completed")
            console.log(`Ranked ${event.count} opportunities.`);
          if (event.step === "recommend" && event.status === "started")
            console.log("Generating recommendation...");
          if (event.step === "recommend" && event.status === "completed")
            console.log("Recommendation validated.");
        },
      },
    );
    if (args.includes("--json"))
      console.log(
        JSON.stringify({ queries: result.queries, opportunities: result.opportunities }, null, 2),
      );
    else {
      console.log(`Query plan: ${result.queries.map((item) => item.query).join(" | ")}`);
      const actionable = result.opportunities.filter((item) => item.quality === "actionable");
      console.log(`Found ${result.opportunities.length} candidates.`);
      console.log(`Kept ${actionable.length} actionable opportunities.`);
      actionable
        .slice(0, 10)
        .forEach((item, index) => console.log(`${index + 1}. ${item.title} ${item.url}`));
      if (result.recommendation) console.log(`\n${JSON.stringify(result.recommendation, null, 2)}`);
    }
    return;
  }
  throw new Error("Provide --profile path/to/profile.json or --profile-json '{...}'.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
