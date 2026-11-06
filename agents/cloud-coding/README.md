# Cloud coding experiment

This experiment gives an existing agent a disposable Cloudflare workspace.
The MCP server exposes Cloudflare Code Mode `search` and `execute` tools.
The workspace starts with a small TypeScript bug and no credentials.
The container has internet access disabled.

Read [DESIGN.md](DESIGN.md) for the design and later milestones.
This is a learning experiment. It is not a production security boundary.

## Requirements

- Node.js, pnpm, and Docker. Start the Docker daemon before local tests.
- A Cloudflare account with the [Workers Paid plan](https://developers.cloudflare.com/sandbox/) for deployment.
- Codex or another MCP client for interactive use.

Run commands from the repository root. Install dependencies with `pnpm install`.

## Run locally

Start the local server with a test token. Use this token only on your machine.

```sh
pnpm --filter cloud-coding exec wrangler dev --local --port 8799 --var MCP_BEARER_TOKEN:local-test-token-12345
```

In another terminal, run the smoke test:

```sh
MCP_BEARER_TOKEN=local-test-token-12345 node agents/cloud-coding/test/local-smoke.mjs
```

The test checks authentication, tool discovery, the fixture fix, and a denied network request.
It also checks the test status and patch. The test deletes its workspace at the end.
One failed network request does not prove that all network access is blocked.
Local Docker isolation is different from the deployed Cloudflare container isolation.

To connect Codex, put the test token in its environment and add the server:

```sh
export CLOUD_CODING_TOKEN=local-test-token-12345
codex mcp add cloud-coding --url http://127.0.0.1:8799/mcp --bearer-token-env-var CLOUD_CODING_TOKEN
```

Start a new Codex session with that environment. Ask it to use the `cloud-coding` MCP tools.
Ask it to fix the fixture, run the tests, and show the patch.
Codex may require approval for MCP tool calls. A session that denies approvals cannot complete this task.

## Deploy later

First check the account plan and Cloudflare container charges.
Use a unique, random bearer token for the deployed server.
Set `MCP_BEARER_TOKEN` as a Worker secret with Wrangler. Do not put it in source files or chat.
Use `wrangler deploy` from this package to deploy after you configure the account.
Use an HTTPS MCP URL and keep the bearer token in the client environment.

## Current limits

- The local smoke test uses an MCP client. It does not prove that a Codex session completed the task.
- Cloudflare deployment and deployed network isolation have not yet been tested.
- The server uses one shared fixture workspace for all holders of the token. It is for one trusted user and one task at a time.
- The workspace is disposable. Cleanup or inactivity deletes its files.
- Commands time out and output is capped. The implementation does not fully contain hostile process trees or output-file tampering.
- Command status does not survive a client disconnect. An interrupted command may have changed the workspace.
- The server supports the bundled fixture only. It does not clone repositories or install packages.
- The patch is a `diff -u` result. The managed image does not provide Git.
- Code Mode is experimental. Its APIs may change.
