import { isJobAggregationText, type Opportunity } from "./domain.js";

export type GithubIssue = {
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
type SearchResponse = { items: GithubIssue[] };
const PAGE_SIZE = 20;
const MAX_PAGES = 3;
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 10_000;

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
async function searchIssues(query: string): Promise<GithubIssue[]> {
  const issues: GithubIssue[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await fetchGithubPage(query, page);
    const body: unknown = await response.json();
    if (!isSearchResponse(body)) throw new Error("GitHub search returned malformed data.");
    issues.push(...body.items);
    if (body.items.length < PAGE_SIZE) break;
  }
  return issues;
}

async function fetchGithubPage(query: string, page: number): Promise<Response> {
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=${PAGE_SIZE}&page=${page}`;
  const init: RequestInit = {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  };
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, init);
      if (response.ok) return response;
      if (response.status === 403 || response.status === 429) {
        throw new Error(
          `GitHub rate limit reached (${response.status}). Check GITHUB_TOKEN and rate limits.`,
        );
      }
      if (response.status < 500 || attempt === MAX_RETRIES) {
        throw new Error(`GitHub search failed (${response.status}).`);
      }
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        if (error instanceof Error && error.name === "TimeoutError") {
          throw new Error(`GitHub search timed out after ${REQUEST_TIMEOUT_MS}ms.`);
        }
        throw error;
      }
    }
  }
  throw new Error("GitHub search failed after retries.");
}

function isSearchResponse(value: unknown): value is SearchResponse {
  if (!value || typeof value !== "object" || !Array.isArray((value as { items?: unknown }).items)) {
    return false;
  }
  return (value as { items: unknown[] }).items.every((item) => {
    if (!item || typeof item !== "object") return false;
    const issue = item as Partial<GithubIssue>;
    return (
      typeof issue.title === "string" &&
      (issue.body === null || typeof issue.body === "string") &&
      typeof issue.html_url === "string" &&
      typeof issue.repository_url === "string" &&
      typeof issue.number === "number" &&
      (issue.state === "open" || issue.state === "closed") &&
      typeof issue.comments === "number" &&
      typeof issue.updated_at === "string"
    );
  });
}
export function toOpportunity(issue: GithubIssue, kind: "oss" | "job"): Opportunity {
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
    source: kind === "job" && isJobAggregation(issue)
      ? "job_aggregation"
      : kind === "job" && isDirectJob(issue)
        ? "direct_job"
        : "github_issue",
  };
}
function isJobAggregation(issue: GithubIssue): boolean {
  return isJobAggregationText(`${issue.title} ${issue.body ?? ""}`);
}
function isDirectJob(issue: GithubIssue): boolean {
  return /https?:\/\/(?:[^\s/]+\.)?(?:greenhouse\.io|jobs\.ashbyhq\.com|lever\.co|workday(?:jobs)?\.com|myworkdayjobs\.com)\//i.test(
    issue.body ?? "",
  );
}
