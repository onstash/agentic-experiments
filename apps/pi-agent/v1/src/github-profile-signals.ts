import { writeFile } from "node:fs/promises";

const API_URL = "https://api.github.com";
const API_VERSION = "2022-11-28";
const PAGE_SIZE = 100;
const MAX_PAGES = 10;
const REQUEST_TIMEOUT_MS = 10_000;

type GithubRepository = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  archived: boolean;
  private: boolean;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string | null;
  updated_at: string;
  license: { spdx_id: string | null; name: string } | null;
};

type GithubUser = { login: string };

type RepositorySignal = {
  name: string;
  url: string;
  description: string | null;
  relationship: "owned" | "forked";
  language: string | null;
  topics: string[];
  license: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  archived: boolean;
  private: boolean;
  pushedAt: string | null;
  updatedAt: string;
};

type ProfileSignals = {
  githubUser: string;
  collectedAt: string;
  repositories: RepositorySignal[];
  inferredLanguages: string[];
  inferredTopics: string[];
};

async function githubGet<T>(path: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) throw new Error("GITHUB_TOKEN is required.");

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": API_VERSION,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    if (response.status === 401)
      throw new Error("GitHub authentication failed. Check GITHUB_TOKEN.");
    if (response.status === 403 || response.status === 429)
      throw new Error("GitHub rate limit reached.");
    throw new Error(`GitHub API request failed (${response.status}).`);
  }
  return (await response.json()) as T;
}

async function listRepositories(username: string): Promise<GithubRepository[]> {
  const repositories: GithubRepository[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const items = await githubGet<GithubRepository[]>(
      `/users/${encodeURIComponent(username)}/repos?type=all&sort=updated&direction=desc&per_page=${PAGE_SIZE}&page=${page}`,
    );
    if (!Array.isArray(items)) throw new Error("GitHub repository response was malformed.");
    repositories.push(...items);
    if (items.length < PAGE_SIZE) break;
  }
  return repositories;
}

function toSignal(repository: GithubRepository): RepositorySignal {
  return {
    name: repository.full_name,
    url: repository.html_url,
    description: repository.description,
    relationship: repository.fork ? "forked" : "owned",
    language: repository.language,
    topics: repository.topics,
    license: repository.license?.spdx_id ?? repository.license?.name ?? null,
    stars: repository.stargazers_count,
    forks: repository.forks_count,
    openIssues: repository.open_issues_count,
    archived: repository.archived,
    private: repository.private,
    pushedAt: repository.pushed_at,
    updatedAt: repository.updated_at,
  };
}

export async function collectProfileSignals(): Promise<ProfileSignals> {
  const user = await githubGet<GithubUser>("/user");
  if (!user.login) throw new Error("GitHub user response was malformed.");
  const repositories = (await listRepositories(user.login)).map(toSignal);
  const languages = new Set(
    repositories.flatMap((repository) => (repository.language ? [repository.language] : [])),
  );
  const topics = new Set(repositories.flatMap((repository) => repository.topics));
  return {
    githubUser: user.login,
    collectedAt: new Date().toISOString(),
    repositories,
    inferredLanguages: [...languages].sort(),
    inferredTopics: [...topics].sort(),
  };
}

async function main(): Promise<void> {
  const outputIndex = process.argv.indexOf("--output");
  const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : undefined;
  if (outputIndex >= 0 && !outputPath) throw new Error("--output requires a file path.");
  const signals = await collectProfileSignals();
  const json = `${JSON.stringify(signals, null, 2)}\n`;
  if (outputPath) await writeFile(outputPath, json, "utf8");
  else process.stdout.write(json);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
