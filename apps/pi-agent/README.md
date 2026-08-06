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
```

The repository includes a starter profile at `profile.json`. Copy it or replace
it with your own profile using the documented schema.

The accepted schema is [profile.schema.json](./profile.schema.json). Validation
requires `name`, `profile`, `experience_years`, `primary_skills`, `interests`,
and `target_roles`. Additional profile fields are optional and preserved.

The current evals are deterministic unit-level checks. Add recorded GitHub
fixtures before adding network-dependent evals so results stay reproducible.

The Pi AI dependency is declared in this package for the model-streaming runtime
step. Search and ranking remain deterministic and inspectable.

Add `--stream` to send ranked opportunities to `gpt-4o-mini` through Pi AI. Set
`OPENAI_API_KEY` before using streaming mode. Without `--stream`, the CLI prints
deterministic JSON and does not require an OpenAI key.
