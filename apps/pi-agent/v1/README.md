# Pi agent setup

`apps/pi-agent` is a self-contained setup, evaluation, and test package for the
GitHub opportunity agent. It owns profile validation, GitHub search, ranking,
and quality checks.

```bash
cd apps/pi-agent
pnpm install
pnpm check
pnpm test
pnpm eval
pnpm run-profile -- --profile ./profile.json
```

Profiles can be supplied as a file or inline JSON:

```bash
pnpm run-profile -- --profile ./profile.json
pnpm run-profile -- --profile-json '{"name":"Santosh","profile":"AI-native product engineer","experience_years":11,"primary_skills":["Python","React"],"interests":["Agents"],"target_roles":["Principal Engineer"]}'
pnpm run-profile -- --profile ./profile.json --query "AI developer tools jobs"
pnpm run-agent -- --profile ./profile.json --query "AI developer tools jobs" --stream
# Derive up to three queries from the profile.
pnpm run-agent -- --profile ./profile.json
# Print machine-readable results.
pnpm run-agent -- --profile ./profile.json --query "AI developer tools" --json
# Increase the bounded query limit when the profile needs wider coverage.
pnpm run-agent -- --profile ./profile.json --max-iterations 7
# Use a shorter cache window for a live demo.
GITHUB_CACHE_TTL_MS=60000 pnpm run-agent -- --profile ./profile.json --query "AI product builder TypeScript React full-stack developer tools" --max-iterations 3 --stream
pnpm auth:login
```

The repository includes a starter profile at `profile.json`. Copy it or replace
it with your own profile using the documented schema.

The accepted schema is [profile.schema.json](./profile.schema.json). Validation
requires `name`, `profile`, `experience_years`, `primary_skills`, `interests`,
and `target_roles`. Additional profile fields are optional and preserved.

The current evals are deterministic unit-level checks. Add recorded GitHub
fixtures before adding network-dependent evals so results stay reproducible.

GitHub search uses read-only API requests. Each search uses up to three pages,
with 20 issues per page. Each request has a 10-second timeout and retries
transient server failures up to two times. Rate-limit and malformed-response
errors stop the search with a clear error.

GitHub search caches valid issue pages for 15 minutes by default. Set
`GITHUB_CACHE_TTL_MS` to change the cache time. Failed and malformed responses
are not cached. Source filters reject security reports, data-leak reports, and
content aggregators before ranking. Repository search runs first. It requires a
license, recent code activity, and a non-archived, non-fork repository. Set
`GITHUB_REPOSITORY_FRESHNESS_DAYS` to change the 30-day default. Set
`GITHUB_IGNORED_REPOSITORIES` to a comma-separated list of `owner/name` values.

The Pi AI dependency is declared in this package for the model-streaming runtime
step. Search and ranking remain deterministic and inspectable.

The default agent run derives a bounded query plan when `--query` is absent. It
searches queries in priority order, stops when it finds enough actionable
opportunities, deduplicates results, ranks them, and writes JSONL run events to
`sessions/`. Use `--log` to select another event log path.
The default limit is five query iterations. Use `--max-iterations` to set a
higher bounded limit for a run.

Run `pnpm auth:login` once to sign in with ChatGPT through the OpenAI Codex OAuth
flow. Credentials are stored in `.auth/auth.json`, which is ignored by Git. Add
`--stream` to send ranked opportunities to the Codex `gpt-5.4-mini` model through
Pi AI with low reasoning effort. Without `--stream`, the CLI prints a readable
summary. Use `--json` for machine-readable output.

Streamed runs use the Earendil Pi coding-agent session manager. Pi stores each
session as JSONL under `~/.pi/agent/sessions/`. The session file supports
resume and branching through the Pi coding-agent tools.

The package requires Node.js 22.19.0 or later. Run the verification commands
from `apps/pi-agent` after dependency changes:

```bash
pnpm check
pnpm test
pnpm eval
```
