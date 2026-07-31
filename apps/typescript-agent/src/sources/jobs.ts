import type { RawJobHit } from "../normalize/jobs.js";
import { scoreQueryMatch } from "../search/matches-query.js";
import type { ScoredSourceHit } from "../types.js";

export async function fetchRawJobHits(userInput?: string): Promise<ScoredSourceHit<RawJobHit>[]> {
  const rawJobHits: RawJobHit[] = [
    {
      orgName: "Example DevTools",
      postingUrl: "https://github.com/example/jobs/issues/12",
      roleTitle: "Developer Relations Engineer",
      summary: "Looking for a TypeScript-heavy developer educator.",
      skills: ["typescript", "github", "developer tools"],
      updatedAt: "2026-07-09T08:00:00Z",
      source: "official_org",
    },
  ];

  return rawJobHits
    .map((hit) => ({
      hit,
      queryScore: scoreQueryMatch(
        [hit.orgName, hit.roleTitle, hit.summary, ...hit.skills],
        userInput,
      ),
    }))
    .filter((entry) => entry.queryScore > 0)
    .sort((a, b) => b.queryScore - a.queryScore);
}
