# Repository-first opportunity search

## Problem Statement

The agent searches GitHub issues before it verifies the repository. It can therefore treat any issue as an open-source opportunity. Recent runs returned security reports, content aggregators, unrelated repositories, and issues from a repository without verified open-source license evidence.

The agent also has useful GitHub profile signals. These include owned repositories, forked repositories, languages, topics, and recent code activity. The current search does not use these signals.

## Solution

Search and verify repositories before searching their issues. Use the user's explicit interests and GitHub profile signals to find relevant repositories. Verify repository eligibility with license, activity, archive, fork, manual exclusion, and source-quality checks. Search issues only inside eligible repositories. Preserve rejected records for audit, but do not rank them or send them to the recommendation model.

## User Stories

1. As an opportunity seeker, I want the agent to search repositories before issues, so that issue results come from relevant projects.
2. As an opportunity seeker, I want only repositories with verified open-source license evidence to produce `oss` opportunities, so that the agent does not make unsupported open-source claims.
3. As an opportunity seeker, I want archived repositories excluded, so that the agent does not suggest inactive projects.
4. As an opportunity seeker, I want repositories with no recent code activity downgraded or excluded, so that results reflect current projects.
5. As an opportunity seeker, I want a configurable repository freshness window with a 30-day default, so that I can adjust the search for slower projects.
6. As an opportunity seeker, I want the agent to use `pushed_at` for code freshness, so that metadata-only updates do not appear as code activity.
7. As an opportunity seeker, I want manually ignored repositories excluded, so that known bad sources never reach recommendations.
8. As an opportunity seeker, I want ignored records retained in the run log, so that I can audit filtering decisions.
9. As an opportunity seeker, I want forked repositories treated differently from owned repositories, so that a temporary fork does not have the same weight as a project I maintain.
10. As an opportunity seeker, I want recent activity in my owned repositories to strengthen related search terms, so that current work improves discovery.
11. As an opportunity seeker, I want recent activity in my forked repositories to provide an interest signal, so that active experiments influence search.
12. As an opportunity seeker, I want old repository activity to decay over time, so that historical interests remain useful without dominating current interests.
13. As an opportunity seeker, I want explicit interests such as React, React Native, TypeScript, JavaScript, full-stack development, APIs, and backend services preserved, so that agentic work does not dominate all results.
14. As an opportunity seeker, I want repository languages, topics, and descriptions used as search vocabulary, so that the agent can expand queries with relevant terms.
15. As an opportunity seeker, I want repository candidates deduplicated before enrichment, so that the agent uses its GitHub API budget efficiently.
16. As an opportunity seeker, I want repository metadata cached during a run, so that repeated issue results do not trigger repeated metadata requests.
17. As an opportunity seeker, I want issue searches scoped with `repo:owner/name`, so that the agent searches only approved repositories.
18. As an opportunity seeker, I want security reports, data-leak reports, vulnerability disclosures, and incident reports excluded from contribution recommendations, so that the agent does not present harmful or irrelevant work as an opportunity.
19. As an opportunity seeker, I want content aggregators, scanners, digests, and job feeds excluded, so that the recommendation set contains actionable opportunities.
20. As an opportunity seeker, I want broad architectural and stale issues classified separately, so that I can understand why they were not recommended.
21. As an opportunity seeker, I want rate-limit failures to preserve earlier valid results, so that a partial run remains useful.
22. As an opportunity seeker, I want every rejected result to include a reason, so that the agent's decisions are explainable.
23. As an opportunity seeker, I want the recommendation model to receive only actionable opportunities, so that rejected records cannot influence the final answer.
24. As an opportunity seeker, I want repository eligibility and opportunity ranking kept separate, so that popularity does not replace trust checks.
25. As an opportunity seeker, I want the agent to respect a bounded repository and issue budget, so that a broad profile does not exhaust GitHub rate limits.

## Implementation Decisions

- Add a repository candidate and repository metadata boundary before issue search.
- Enrich candidates with license, archive, fork, private, language, topics, description, stars, open issue count, `pushed_at`, and `updated_at` data.
- Use `pushed_at` for code freshness. Use issue `updated_at` for issue freshness.
- Use a 30-day repository code freshness default. Make the threshold configurable.
- Treat an approved license as a hard requirement for `kind: "oss"`.
- Exclude archived repositories by default.
- Do not treat a fork as an owned project. Use fork status as a personalization signal only.
- Apply the manual repository denylist before issue search.
- Normalize repository identifiers as lowercase `owner/name` values.
- Rank repositories in two stages. Apply hard eligibility gates first. Score only eligible repositories second.
- Require an approved license, non-archived status, recent `pushed_at` activity, no manual exclusion, and no known low-quality source classification before scoring.
- Score eligible repositories with skill match, interest match, profile signals, code activity, contribution signals, project health, and low-weight popularity.
- Give owned and recently active repositories more profile weight than old owned repositories. Give active forks less weight than owned repositories.
- Use stars and forks as popularity signals only. Do not use them as eligibility evidence.
- Apply stale and fork penalties during scoring when the repository passes the eligibility gates.
- Keep repository score separate from issue score. Repository score selects projects. Issue score selects opportunities within those projects.
- Keep rejected repository and issue records in audit events. Do not include them in ranked opportunities or recommendation input.
- Keep explicit profile interests separate from inferred GitHub signals. Combine them during query planning.
- Weight owned, recently pushed repositories more than old owned repositories. Weight active forks below owned repositories. Apply recency decay to both.
- Search only the top eligible repositories after deduplication and enrichment.
- Search issues with repository-qualified GitHub queries.
- Cache repository metadata and issue search responses with a configurable TTL.
- Use a stable cache key for each GitHub request, including the endpoint and query parameters.
- Return a cached response when its age is less than the TTL.
- Fetch a new response when the cache entry is missing or older than the TTL.
- Store response time, request key, source endpoint, and response data in each cache entry.
- Do not cache authentication failures or malformed responses.
- Keep rate-limit and timeout behavior active for cache misses.
- Report cache hits and misses in run metadata.
- Reuse the existing opportunity quality classifier for issue-level checks, and extend its evidence with repository eligibility reasons.
- Add source-quality reasons for security reports, data-leak reports, aggregators, scanners, and other rejected sources.
- Keep repository eligibility as a hard gate. Use stars, issue activity, and contribution labels only for ranking eligible repositories.
- Preserve bounded query execution and existing partial-run rate-limit recovery.
- Use the generated GitHub profile signal artifact as input data for tests and evaluation. Do not require live profile access for unit tests.

## Testing Decisions

- Test external behavior at the repository-search and agent-loop seams.
- Test that a repository without an approved license cannot produce an OSS opportunity.
- Test that archived and manually ignored repositories produce audit records but no ranked results.
- Test the 30-day `pushed_at` threshold and configurable threshold.
- Test that forked repositories receive a different signal weight from owned repositories.
- Test that ineligible repositories receive no score.
- Test that eligible repositories receive scores from skill match, interest match, profile signals, activity, contribution signals, project health, and popularity.
- Test that popularity cannot make an ineligible repository eligible.
- Test that repository ranking and issue ranking use separate scores.
- Test that explicit React, React Native, TypeScript, JavaScript, and full-stack interests remain in query planning alongside agent interests.
- Test repository deduplication and metadata caching behavior through fake GitHub responses.
- Test that a fresh cache entry prevents a GitHub request.
- Test that an expired cache entry causes one new GitHub request.
- Test that different query parameters produce different cache keys.
- Test that failed and malformed responses do not create cache entries.
- Test repository-qualified issue queries.
- Test rejection of security, data-leak, aggregator, scanner, and job-feed records.
- Test that only actionable records reach the recommendation function.
- Test partial results after a later GitHub rate-limit failure.
- Add regression fixtures for the recent false positives: `net4people/bbs#519`, `OmniBlocks/monorepo`, `jhengy/content-aggregator`, and the two `anthropics/claude-code` issues.
- Follow existing `apps/pi-agent` tests for domain classification, ranking, GitHub response validation, and agent-loop behavior.
- Run `pnpm check`, `pnpm test`, and `pnpm eval` from `apps/pi-agent`.

## Out of Scope

- Automatically applying to jobs or contributing code.
- Treating stars as proof of repository quality.
- Building a permanent cross-run repository reputation system.
- Searching private repositories beyond the authenticated user's accessible repositories.
- Adding a large list of title regular expressions as the main quality strategy.
- Changing the TypeScript learning agent.
- Committing generated profile data as a required runtime dependency.

## Further Notes

The current profile signal artifact contains 105 repositories, including 51 owned and 54 forked repositories. It identifies TypeScript, JavaScript, Python, HTML, CSS, Go, Shell, Ruby, C++, Dart, and Nix. Recent activity strongly signals agent tooling, but explicit interests must also preserve React, React Native, and full-stack development.

The first implementation should use one high-level seam: the agent-loop search boundary. The search function should return repository-qualified, eligible opportunities or auditable rejected records. Ranking and recommendation should remain downstream consumers of that boundary.
