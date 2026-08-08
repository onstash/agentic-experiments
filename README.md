# GitHub Opportunity Agent

This repository contains an agent that finds and ranks GitHub opportunities for
a user profile. The main implementation is in `apps/pi-agent`.

## Pi agent

The Pi agent provides:

- Profile validation from a file or inline JSON.
- Read-only GitHub issue search.
- Deterministic opportunity ranking and quality labels.
- Bounded search, ranking, and recommendation steps.
- Native Earendil Pi JSONL sessions for streamed recommendations.
- GitHub pagination, timeouts, retries, and response validation.

## Run the agent

```bash
cd apps/pi-agent
pnpm install
pnpm run-profile -- --profile ./profile.json --query "AI developer tools jobs"
pnpm run-agent -- --profile ./profile.json --query "AI developer tools jobs" --stream
```

The `--stream` mode requires Pi authentication. Pi stores session files under
`~/.pi/agent/sessions/`.

## Verify the package

Run these commands from `apps/pi-agent`:

```bash
pnpm check
pnpm test
pnpm eval
```

The package requires Node.js 22.19.0 or later. See
[apps/pi-agent/README.md](apps/pi-agent/README.md) for the profile schema,
authentication details, and search behavior.
