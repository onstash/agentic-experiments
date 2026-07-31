import type { RawOssHit } from "../normalize/oss.js";
import { scoreQueryMatch } from "../search/matches-query.js";
import type { ScoredSourceHit } from "../types.js";

export async function fetchRawOssHits(userInput?: string): Promise<ScoredSourceHit<RawOssHit>[]> {
  const rawOssHits: RawOssHit[] = [
    {
      repoName: "tanstack/query",
      repoUrl: "https://github.com/TanStack/query",
      repoOwner: "TanStack",
      issueTitle: "Improve docs for query invalidation",
      issueBody: "Looking for help improving beginner-facing docs.",
      labels: ["documentation", "good first issue"],
      stars: 18000,
      updatedAt: "2026-07-10T10:00:00Z",
      topics: ["typescript", "react", "data-fetching"],
    },
  ];

  return rawOssHits
    .map((hit) => ({
      hit,
      queryScore: scoreQueryMatch(
        [
          hit.repoName,
          hit.repoOwner,
          hit.issueTitle ?? "",
          hit.issueBody ?? "",
          ...hit.topics,
          ...hit.labels,
        ],
        userInput,
      ),
    }))
    .filter((entry) => entry.queryScore > 0)
    .sort((a, b) => b.queryScore - a.queryScore);
}
