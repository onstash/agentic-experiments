# Total Recall secrets

## Generate a token

Generate the token outside the agent process:

```sh
openssl rand -base64 32
```

Do not paste the token into chat, source files, commit messages, or logs.

## Local development

Create `agents/total-recall/.dev.vars` manually:

```text
TOTAL_RECALL_TOKEN=<generated-token>
LIFE_OS_SERVICE_TOKEN=<Life OS Total Recall service token>
```

`.dev.vars` is ignored by Git. Start Wrangler from the Total Recall directory:

```sh
pnpm dev
```

Supply the token to an MCP client through its local environment or secret
manager. The model should receive tool results, not the token itself.

## Deployment

Set the secret interactively so it is not placed in shell history or source:

```sh
pnpm wrangler secret put TOTAL_RECALL_TOKEN
pnpm wrangler secret put LIFE_OS_SERVICE_TOKEN
```

Paste the generated token only into Wrangler's prompt. Rotate it by running the
same command with a new token, then update the client-side secret store.

The Worker compares the presented MCP bearer token to `TOTAL_RECALL_TOKEN` at
runtime. It sends `LIFE_OS_SERVICE_TOKEN` only to Life OS for proposal creation
and lookup. Neither secret is persisted in D1, returned in responses, or
included in logs.
