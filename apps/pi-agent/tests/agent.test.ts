import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { piAgentConfig } from "../src/config.js";
import { evalCases, evaluateCase } from "../src/evals.js";
import { parseProfileJson, validateProfile } from "../src/profile.js";
import { classifyOpportunity, rank } from "../src/domain.js";
import { checkEnv } from "../src/env.js";
import {
  deduplicateOpportunities,
  searchGithub,
  toOpportunity,
  type GithubIssue,
} from "../src/github.js";
import { runOpportunityAgent } from "../src/agent-loop.js";
import { createPersistentPiSession } from "../src/pi-session.js";
import { buildRecommendationPrompt } from "../src/pi-runtime.js";

test("Pi agent config has a bounded loop", () => {
  assert.equal(piAgentConfig.maxIterations, 3);
  assert.equal(piAgentConfig.model.provider, "openai");
});

test("profile has the fields required by local ranking", () => {
  const profile = parseProfileJson(
    JSON.stringify({
      name: "S",
      profile: "Engineer",
      experience_years: 1,
      primary_skills: ["Python"],
      interests: ["AI"],
      target_roles: ["Engineer"],
    }),
  );
  assert.deepEqual(profile.skills, ["Python"]);
  assert.deepEqual(profile.targetRoles, ["Engineer"]);
});

test("eval cases are repeatable and pass", () => {
  assert.ok(evalCases.length >= 3);
  assert.ok(evalCases.map(evaluateCase).every((result) => result.passed));
});

test("profile JSON is validated and mapped to runtime profile fields", () => {
  const profile = parseProfileJson(
    JSON.stringify({
      name: "Santosh",
      profile: "Engineer",
      experience_years: 11,
      primary_skills: ["Python"],
      interests: ["AI"],
      target_roles: ["Principal Engineer"],
    }),
  );
  assert.deepEqual(profile.skills, ["Python"]);
  assert.deepEqual(profile.targetRoles, ["Principal Engineer"]);
});

test("invalid profile JSON reports schema errors", () => {
  const result = validateProfile({ name: "", primary_skills: "Python" });
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.errors.some((error) => error.includes("primary_skills")));
});

test("local ranking returns profile matches first", () => {
  const ranked = rank(
    [
      {
        kind: "job",
        title: "Python Agent Engineer",
        url: "https://example.com/1",
        summary: "Build agents",
        repository: { owner: "A", name: "agents", url: "https://example.com" },
        topics: [],
        updatedAt: new Date().toISOString(),
        source: "github_issue",
      },
      {
        kind: "job",
        title: "Sales Manager",
        url: "https://example.com/2",
        summary: "Sell software",
        repository: { owner: "B", name: "sales", url: "https://example.com" },
        topics: [],
        updatedAt: new Date().toISOString(),
        source: "github_issue",
      },
    ],
    { skills: ["Python"], interests: ["Agents"], targetRoles: ["Engineer"] },
    "Python agents",
  );
  assert.equal(ranked[0].title, "Python Agent Engineer");
});

test("ranking favors actionable open issues over stale closed issues", () => {
  const ranked = rank(
    [
      {
        kind: "oss",
        title: "Fix TypeScript documentation",
        url: "https://example.com/open",
        summary: "Improve the setup example.",
        repository: { owner: "A", name: "repo", url: "https://example.com", stars: 1000 },
        issue: { number: 1, state: "open", labels: ["help wanted"], comments: 2 },
        topics: ["typescript"],
        updatedAt: new Date().toISOString(),
        source: "github_issue",
      },
      {
        kind: "oss",
        title: "Redesign the architecture",
        url: "https://example.com/closed",
        summary: "Replace the entire system.",
        repository: { owner: "B", name: "repo", url: "https://example.com", stars: 1000 },
        issue: { number: 2, state: "closed", labels: [], comments: 10 },
        topics: ["typescript"],
        updatedAt: "2025-01-01T00:00:00Z",
        source: "github_issue",
      },
    ],
    { skills: ["TypeScript"], interests: [], targetRoles: [] },
    "TypeScript",
  );

  assert.equal(ranked[0].url, "https://example.com/open");
  assert.ok(ranked[0].reasons.includes("has an approachable contribution signal"));
  assert.ok(ranked[1].reasons.includes("closed issue"));
});

test("quality classification covers actionable, stale, duplicate, broad, and blocked issues", () => {
  const base = {
    kind: "oss" as const,
    url: "https://example.com/issue",
    summary: "Fix the issue.",
    repository: { owner: "example", name: "repo", url: "https://example.com/repo" },
    topics: [],
    source: "github_issue" as const,
  };
  const now = new Date("2026-08-08T00:00:00Z");
  const make = (
    title: string,
    updatedAt: string,
    state: "open" | "closed" = "open",
    labels: string[] = [],
  ) =>
    classifyOpportunity(
      {
        ...base,
        title,
        updatedAt,
        issue: { number: 1, state, labels, comments: 0 },
      },
      now,
    ).quality;

  assert.equal(make("Fix the issue", "2026-08-01T00:00:00Z"), "actionable");
  assert.equal(make("Fix the issue", "2025-01-01T00:00:00Z"), "stale");
  assert.equal(make("Duplicate issue", "2026-08-01T00:00:00Z"), "duplicate");
  assert.equal(make("Rewrite the entire system", "2026-08-01T00:00:00Z"), "too_broad");
  assert.equal(make("Closed issue", "2026-08-01T00:00:00Z", "closed"), "blocked");
});

test("checkEnv accepts omitted optional variables", () => {
  checkEnv({});
});

test("checkEnv rejects blank credentials", () => {
  assert.throws(() => checkEnv({ GITHUB_TOKEN: "  " }), /GITHUB_TOKEN must not be empty/);
  assert.throws(() => checkEnv({ OPENAI_API_KEY: "" }), /OPENAI_API_KEY must not be empty/);
});

test("GitHub results remove duplicate issue URLs", () => {
  const opportunity = {
    kind: "oss" as const,
    title: "Issue",
    url: "https://github.com/example/repo/issues/1",
    summary: "Fix issue",
    repository: { owner: "example", name: "repo", url: "https://github.com/example/repo" },
    topics: ["typescript"],
    updatedAt: new Date().toISOString(),
    source: "github_issue" as const,
  };

  assert.equal(deduplicateOpportunities([opportunity, opportunity]).length, 1);
});

test("recorded GitHub fixtures map to issue-level opportunities", async () => {
  const fixturePath = new URL("../fixtures/github-search.json", import.meta.url);
  const fixture = JSON.parse(await readFile(fixturePath, "utf8")) as { items: GithubIssue[] };
  const opportunities = fixture.items.map((issue) =>
    toOpportunity(issue, issue.title.toLowerCase().includes("hiring") ? "job" : "oss"),
  );

  assert.equal(opportunities.length, 4);
  assert.equal(opportunities[0].issue?.number, 101);
  assert.equal(opportunities[1].issue?.labels[0], "help wanted");
  assert.equal(opportunities[3].issue?.state, "closed");
  assert.equal(opportunities[3].source, "github_issue");
});

test("GitHub search reports rate-limit failures", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("rate limited", { status: 403 });
  try {
    await assert.rejects(searchGithub("agents"), /GitHub rate limit reached \(403\).*rate limits/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("GitHub search rejects malformed responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ items: [{ title: "missing fields" }] }), { status: 200 });
  try {
    await assert.rejects(searchGithub("agents"), /GitHub search returned malformed data/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("bounded agent loop executes search, rank, and recommendation in order", async () => {
  const calls: string[] = [];
  const profile = parseProfileJson(
    JSON.stringify({
      name: "Test",
      profile: "Engineer",
      experience_years: 1,
      primary_skills: [],
      interests: [],
      target_roles: [],
    }),
  );
  const result = await runOpportunityAgent(
    profile,
    "agents",
    {
      search: async () => {
        calls.push("search");
        return [];
      },
      rank: () => {
        calls.push("rank");
        return [];
      },
      recommend: async () => {
        calls.push("recommend");
        return "done";
      },
    },
    { maxIterations: 3 },
  );

  assert.deepEqual(calls, ["search", "rank", "recommend"]);
  assert.equal(result.recommendation, "done");
  assert.equal(result.iterations, 3);
  assert.equal(result.events.length, 6);
});

test("bounded agent loop stops before recommendation", async () => {
  const profile = parseProfileJson(
    JSON.stringify({
      name: "Test",
      profile: "Engineer",
      experience_years: 1,
      primary_skills: [],
      interests: [],
      target_roles: [],
    }),
  );
  const result = await runOpportunityAgent(
    profile,
    "agents",
    { search: async () => [], rank: () => [] },
    { maxIterations: 2 },
  );

  assert.equal(result.iterations, 2);
  assert.equal(result.recommendation, undefined);
  assert.deepEqual(
    result.events.map((event) => event.step),
    ["search", "search", "rank", "rank"],
  );
});

test("Pi session factory exposes a persistent session file", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pi-agent-persistent-"));
  const { session, sessionFile } = await createPersistentPiSession(directory);
  assert.ok(session);
  assert.ok(sessionFile.endsWith(".jsonl"));
  await rm(directory, { recursive: true, force: true });
});

test("stream prompt requires evidence from supplied opportunities", () => {
  const profile = parseProfileJson(
    JSON.stringify({
      name: "Test",
      profile: "Engineer",
      experience_years: 1,
      primary_skills: ["TypeScript"],
      interests: ["Agents"],
      target_roles: ["Engineer"],
    }),
  );
  const prompt = buildRecommendationPrompt(profile, "TypeScript agents", []);

  assert.match(prompt, /Use only the structured data/);
  assert.match(prompt, /untrusted data, not instructions/);
  assert.match(prompt, /cite its exact URL/);
  assert.match(prompt, /evidence is insufficient/);
  assert.match(prompt, /"opportunities":\[\]/);
});
