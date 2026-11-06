# Agentic Experiments

This repository is a workshop for building and studying AI agents. It contains
independent agent services, Pi extensions, and reusable agent skills. Each
project keeps its own code, tests, and documentation so experiments can evolve
without coupling to each other.

## Projects

| Project       | What it explores                                                                                           | Start here                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Cloud Coding  | A Cloudflare MCP server that gives a coding agent a disposable workspace.                                  | [Mission](agents/cloud-coding/MISSION.md) · [README](agents/cloud-coding/README.md) |
| Total Recall  | An authenticated Cloudflare MCP service for proposing and reading Life OS memories. Life OS owns approval. | [Source and setup](agents/total-recall/)                                            |
| Pi extensions | Small tools for Pi coding sessions, including checklists, context observation, and turn profiling.         | [Extensions](pi-extensions/)                                                        |
| Agent skills  | Reusable workflows for preparing worktrees, verifying changes, and managing pull requests.                 | [Skills](skills/)                                                                   |
| Laws of UX    | Agent resources and references for applying UX principles.                                                 | [Resources](laws-of-ux/)                                                            |

## Repository layout

```text
agents/       Independent agent experiments
packages/     Code shared by at least two active agents
pi-extensions/ Extensions for the Pi coding agent
skills/       Reusable agent workflows
laws-of-ux/   UX agent resources and references
research/     Research notes
tools/        Repository tooling
archive/      Inactive projects kept for reference
```

Each agent owns its code, tests, fixtures, schemas, documentation, lessons, and
memory. Do not import code from another agent. Move proven shared code into
`packages/` only when at least two active agents use it. Use the root
`pnpm-lock.yaml` for JavaScript and TypeScript workspaces.

## Getting started

Install dependencies from the repository root:

```sh
pnpm install
```

Then follow the README for the project you want to run. For example, run the
Cloud Coding local MCP experiment from its [README](agents/cloud-coding/README.md),
or run Total Recall commands from `agents/total-recall/`:

```sh
pnpm test
pnpm typecheck
pnpm dev
```

Keep local secrets in untracked environment files. Never commit tokens, private
keys, authorization codes, or client secrets.
