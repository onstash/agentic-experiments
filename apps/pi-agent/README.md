# Pi agent setup

`apps/pi-agent` is the dedicated setup, evaluation, and test package for the
GitHub opportunity agent. It uses the existing source adapters and runtime in
`apps/typescript-agent` while keeping Pi configuration and quality checks in one
place.

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
```

The accepted schema is [profile.schema.json](./profile.schema.json). Validation
requires `name`, `profile`, `experience_years`, `primary_skills`, `interests`,
and `target_roles`. Additional profile fields are optional and preserved.

The current evals are deterministic unit-level checks. Add recorded GitHub
fixtures before adding network-dependent evals so results stay reproducible.

The Pi AI dependency is declared in this package for the next runtime step. The
current adapter remains deterministic and inspectable; model streaming can be
introduced without changing the source normalization or ranking boundary.
