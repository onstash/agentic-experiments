# Agentic Experiments

This repository contains independent agent experiments.

## Active agents

### Total Recall

`agents/total-recall/` is a Cloudflare Worker that exposes a small, authenticated MCP server for Life OS memory workflows.

It supports:

- Proposing memory for Life OS review.
- Reading proposal details.
- Recording approval or rejection decisions.
- JSON-RPC and MCP Streamable HTTP transport.
- OAuth access-token validation and Life OS authorization.

Life OS remains the approval boundary. Total Recall can propose and retrieve memory, but it cannot approve memory outside the Life OS decision flow.

## Repository structure

```text
agents/       Independent, complete agent experiments
packages/     Code shared by at least two active agents
archive/      Inactive material kept for reference
```

Each agent owns its source code, tests, schemas, documentation, lessons, and memory. Do not import code directly from another agent. Move proven shared code into `packages/` only when at least two active agents need it.

## Total Recall development

Run commands from `agents/total-recall/`:

```bash
pnpm test
pnpm typecheck
pnpm dev
```

Use the local variable template for development secrets. Never commit `.dev.vars`, tokens, authorization codes, private keys, or client secrets.
