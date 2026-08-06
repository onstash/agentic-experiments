import type { Opportunity } from "./domain.js";

type Issue = {
  title: string;
  body: string | null;
  html_url: string;
  repository_url: string;
  updated_at: string;
  labels?: { name: string }[];
};
type SearchResponse = { items: Issue[] };

export async function searchGithub(query: string): Promise<Opportunity[]> {
  const [oss, jobs] = await Promise.all([
    searchIssues(`${query} is:issue is:open (label:"good first issue" OR label:"help wanted")`),
    searchIssues(`${query} (job OR hiring OR careers) is:issue is:open`),
  ]);
  return [
    ...oss.map((issue) => toOpportunity(issue, "oss")),
    ...jobs.map((issue) => toOpportunity(issue, "job")),
  ];
}
async function searchIssues(query: string): Promise<Issue[]> {
  const response = await fetch(
    `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=20`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
    },
  );
  if (!response.ok)
    throw new Error(
      `GitHub search failed (${response.status}). Check GITHUB_TOKEN and rate limits.`,
    );
  return ((await response.json()) as SearchResponse).items;
}
function toOpportunity(issue: Issue, kind: "oss" | "job"): Opportunity {
  const path = issue.repository_url.split("/repos/")[1]?.split("/") ?? ["unknown", "unknown"];
  const labels = issue.labels?.map((label) => label.name) ?? [];
  return {
    kind,
    title: issue.title,
    url: issue.html_url,
    organization: path[0],
    summary: issue.body ?? "",
    topics: labels,
    updatedAt: issue.updated_at,
    source: "github",
  };
}
