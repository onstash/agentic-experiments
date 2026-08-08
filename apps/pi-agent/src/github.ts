import type { Opportunity } from "./domain.js";

type Issue = {
  title: string;
  body: string | null;
  html_url: string;
  repository_url: string;
  number: number;
  state: "open" | "closed";
  comments: number;
  user?: { author_association?: string };
  created_at?: string;
  updated_at: string;
  labels?: { name: string }[];
};
type SearchResponse = { items: Issue[] };

export async function searchGithub(query: string): Promise<Opportunity[]> {
  const [labeledOss, broadOss, jobs] = await Promise.all([
    searchIssues(`${query} is:issue is:open (label:"good first issue" OR label:"help wanted")`),
    searchIssues(`${query} is:issue is:open`),
    searchIssues(`${query} (job OR hiring OR careers) is:issue is:open`),
  ]);
  return deduplicateOpportunities([
    ...labeledOss.map((issue) => toOpportunity(issue, "oss")),
    ...broadOss.map((issue) => toOpportunity(issue, "oss")),
    ...jobs.map((issue) => toOpportunity(issue, "job")),
  ]);
}

export function deduplicateOpportunities(opportunities: Opportunity[]): Opportunity[] {
  const seen = new Set<string>();
  return opportunities.filter((opportunity) => {
    if (seen.has(opportunity.url)) return false;
    seen.add(opportunity.url);
    return true;
  });
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
    summary: issue.body ?? "",
    repository: {
      owner: path[0],
      name: path[1],
      url: `https://github.com/${path[0]}/${path[1]}`,
    },
    issue: {
      number: issue.number,
      state: issue.state,
      labels,
      comments: issue.comments,
      authorAssociation: issue.user?.author_association,
    },
    topics: labels,
    updatedAt: issue.updated_at,
    createdAt: issue.created_at,
    source: "github_issue",
  };
}
