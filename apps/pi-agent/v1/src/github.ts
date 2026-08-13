import { freshnessState, isJobAggregationText, type Opportunity } from "./domain.js";

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
export type GithubRepository = {
  full_name: string;
  html_url: string;
  name: string;
  owner: { login: string };
  description: string | null;
  fork: boolean;
  archived: boolean;
  license: { spdx_id: string | null; name: string } | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string | null;
  updated_at: string;
};
type SearchResponse<T> = { items: T[] };
const PAGE_SIZE = 20;
const MAX_PAGES = 3;
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_REPOSITORIES = 8;
const DEFAULT_REPOSITORY_FRESHNESS_DAYS = 30;
type CacheEntry<T> = { expiresAt: number; value: T };
const searchCache = new Map<string, CacheEntry<GithubIssue[]>>();
const repositoryCache = new Map<string, CacheEntry<GithubRepository[]>>();

export async function searchGithub(query: string): Promise<Opportunity[]> {
  const repositories = await searchRepositories(query);
  const eligible = repositories
    .filter((repository) => repositoryEligibility(repository).eligible)
    .sort((a, b) => scoreRepository(b, query) - scoreRepository(a, query))
    .slice(0, MAX_REPOSITORIES);
  const issues: GithubIssue[] = [];
  for (const repository of eligible) {
    issues.push(...(await searchIssues(`repo:${repository.full_name} is:issue is:open`)));
  }
  return deduplicateOpportunities(issues.map((issue) => toOpportunity(issue, "oss")));
}

export function repositoryEligibility(
  repository: GithubRepository,
  now = new Date(),
): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const ignored = new Set(
    (process.env.GITHUB_IGNORED_REPOSITORIES ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
  if (!repository.license?.spdx_id || repository.license.spdx_id === "NOASSERTION")
    reasons.push("repository has no approved license evidence");
  if (repository.archived) reasons.push("repository is archived");
  if (repository.fork) reasons.push("repository is a fork");
  if (ignored.has(repository.full_name.toLowerCase()))
    reasons.push("repository is manually ignored");
  if (daysSince(repository.pushed_at, now) > repositoryFreshnessDays())
    reasons.push("repository code is not recent");
  return { eligible: reasons.length === 0, reasons };
}

function scoreRepository(repository: GithubRepository, query: string): number {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length >= 2);
  const text =
    `${repository.full_name} ${repository.description ?? ""} ${repository.language ?? ""} ${repository.topics.join(" ")}`.toLowerCase();
  const skillMatch = terms.filter((term) => text.includes(term)).length * 10;
  const age = daysSince(repository.pushed_at);
  const activity = age <= 7 ? 15 : age <= 14 ? 10 : 5;
  const contribution = repository.open_issues_count > 0 ? 5 : 0;
  const popularity = Math.min(5, Math.log10(repository.stargazers_count + 1));
  return skillMatch + activity + contribution + popularity;
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
    const key = `${query}|page=${page}`;
    const cached = searchCache.get(key) as CacheEntry<GithubIssue[]> | undefined;
    const body =
      cached && cached.expiresAt > Date.now() ? cached.value : await fetchGithubPage(query, page);
    searchCache.set(key, { expiresAt: Date.now() + cacheTtlMs(), value: body });
    issues.push(...body);
    if (body.length < PAGE_SIZE) break;
  }
  return issues;
}

async function searchRepositories(query: string): Promise<GithubRepository[]> {
  const key = `repositories|${query}`;
  const cached = repositoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const terms = repositoryTerms(query);
  const repositories = new Map<string, GithubRepository>();
  for (const term of terms.slice(0, 3)) {
    const repositoryQuery = `${term} archived:false`;
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(repositoryQuery)}&sort=updated&order=desc&per_page=${PAGE_SIZE}`;
    const body = await fetchGithubJson<SearchResponse<GithubRepository>>(
      url,
      isRepositorySearchResponse,
      "GitHub search returned malformed data for repositories.",
    );
    for (const repository of body.items) repositories.set(repository.full_name.toLowerCase(), repository);
  }
  const value = [...repositories.values()];
  repositoryCache.set(key, { expiresAt: Date.now() + cacheTtlMs(), value });
  return value;
}

function repositoryTerms(query: string): string[] {
  const ignored = new Set(["a", "an", "and", "builder", "company", "developer", "for", "full", "in", "native", "of", "product", "the", "tools"]);
  const terms = query.toLowerCase().split(/[^a-z0-9+#.-]+/).filter((term) => term.length >= 3 && !ignored.has(term));
  return [...new Set(terms)].slice(0, 6).length ? [...new Set(terms)].slice(0, 6) : ["software"];
}

async function fetchGithubPage(query: string, page: number): Promise<GithubIssue[]> {
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=${PAGE_SIZE}&page=${page}`;
  const body = await fetchGithubJson<SearchResponse<GithubIssue>>(
    url,
    isIssueSearchResponse,
    "GitHub search returned malformed data.",
  );
  return body.items;
}

async function fetchGithubJson<T>(
  url: string,
  isValid: (value: unknown) => value is T,
  malformedMessage: string,
): Promise<T> {
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
      if (response.ok) {
        const body: unknown = await response.json();
        if (!isValid(body)) throw new Error(malformedMessage);
        return body;
      }
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

function cacheTtlMs(): number {
  const configured = Number(process.env.GITHUB_CACHE_TTL_MS);
  return Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_CACHE_TTL_MS;
}

function isIssueSearchResponse(value: unknown): value is SearchResponse<GithubIssue> {
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
function isRepositorySearchResponse(value: unknown): value is SearchResponse<GithubRepository> {
  if (!value || typeof value !== "object" || !Array.isArray((value as { items?: unknown }).items))
    return false;
  return (value as { items: unknown[] }).items.every((item) => {
    if (!item || typeof item !== "object") return false;
    const repository = item as Partial<GithubRepository>;
    return (
      typeof repository.full_name === "string" &&
      typeof repository.html_url === "string" &&
      (typeof repository.description === "string" || repository.description === null)
    );
  });
}
export function toOpportunity(issue: GithubIssue, kind: "oss" | "job"): Opportunity {
  const path = issue.repository_url.split("/repos/")[1]?.split("/") ?? ["unknown", "unknown"];
  const labels = issue.labels?.map((label) => label.name) ?? [];
  const source =
    kind === "job" && isJobAggregation(issue)
      ? "job_aggregation"
      : kind === "job" && applicationUrl(issue)
        ? "direct_job"
        : "github_issue";
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
    source,
    evidence: {
      sourceKind: source,
      sourceUrl: issue.html_url,
      ...(source === "direct_job" ? { applicationUrl: applicationUrl(issue) } : {}),
      provenance: "github_api",
      collectedAt: new Date().toISOString(),
      freshness: freshnessState(issue.updated_at),
      certainty: source === "direct_job" || source === "job_aggregation" ? "inferred" : "verified",
    },
  };
}
function isJobAggregation(issue: GithubIssue): boolean {
  return isJobAggregationText(`${issue.title} ${issue.body ?? ""}`);
}
function applicationUrl(issue: GithubIssue): string | undefined {
  return (issue.body ?? "").match(
    /https?:\/\/(?:[^\s/]+\.)?(?:greenhouse\.io|jobs\.ashbyhq\.com|lever\.co|workday(?:jobs)?\.com|myworkdayjobs\.com)\/[^\s)<>]+/i,
  )?.[0];
}

function repositoryFreshnessDays(): number {
  const configured = Number(process.env.GITHUB_REPOSITORY_FRESHNESS_DAYS);
  return Number.isFinite(configured) && configured >= 0
    ? configured
    : DEFAULT_REPOSITORY_FRESHNESS_DAYS;
}

function daysSince(value: string | null, now = new Date()): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? (now.getTime() - timestamp) / 86_400_000
    : Number.POSITIVE_INFINITY;
}
