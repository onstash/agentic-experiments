# ChatGPT OAuth Research for Total Recall

**Status:** Research complete; architecture decision pending.

## What ChatGPT requires

ChatGPT can connect to a custom remote MCP server as a plugin. For protected
servers, OpenAI recommends OAuth with Client ID Metadata Documents (CIMD).
ChatGPT supports public-client token exchange (`none`) and signed client
assertion token exchange (`private_key_jwt`). Dynamic Client Registration (DCR)
remains a fallback when configured.

This means the current static `TOTAL_RECALL_TOKEN` is appropriate for Codex CLI
smoke testing, but not the production authentication mechanism for ChatGPT.

## Standards requirements

Total Recall must act as an OAuth 2.1 protected resource server:

1. Publish OAuth Protected Resource Metadata under
   `/.well-known/oauth-protected-resource` and identify its authorization
   server.
2. Return `WWW-Authenticate: Bearer` with `resource_metadata` on unauthenticated
   MCP requests.
3. Support authorization-code flow with PKCE S256 through its authorization
   server.
4. Validate token issuer, expiry, signature or introspection result, scopes, and
   audience/resource binding before running an MCP tool.
5. Keep the ChatGPT access token at Total Recall. Never forward it to Life OS.
   Total Recall continues using its separate `LIFE_OS_SERVICE_TOKEN` service
   identity downstream.

## Proposed scopes

```text
total-recall.memory.propose
total-recall.memory.get_proposal
```

There is deliberately no decision scope. Life OS remains the human approval
boundary.

## Required server changes

- Replace static inbound bearer-token-only auth with OAuth token validation.
- Keep `TOTAL_RECALL_TOKEN` as a development/Codex CLI fallback only until it is
  deliberately retired.
- Add protected-resource metadata and OAuth authorization-server discovery.
- Ensure the MCP Streamable HTTP implementation handles initialize, initialized
  notifications, OAuth challenges, and standard headers.
- Keep the Cloudflare `LIFE_OS` service binding and restricted service token for
  Total Recall → Life OS calls.

## Architecture decision still required

Choose the authorization server before implementation:

1. **Managed authorization server** — fastest path if it supports OAuth 2.1,
   PKCE, CIMD or DCR, JWT/JWKS or introspection, and Google sign-in.
2. **Life OS authorization server** — keeps identity in the product, but must
   prove it can publish standards-compliant OAuth metadata, issue/revoke tokens,
   rotate refresh tokens, and register ChatGPT clients safely.

Do not build a custom OAuth server from scratch unless neither option satisfies
ChatGPT's client-registration requirements.

## Verification plan

```text
ChatGPT adds custom MCP server
→ discovers protected-resource metadata
→ discovers authorization server
→ opens Life OS/Google sign-in
→ grants only propose/get scopes
→ calls memory.propose
→ Life OS renders pending proposal
→ owner approves in Life OS
```

## Sources

- OpenAI, [Building MCP servers for plugins and API integrations](https://developers.openai.com/api/docs/mcp)
  — authentication and ChatGPT plugin connection guidance, accessed 2026-10-25.
- Model Context Protocol, [Authorization specification (2025-11-25)](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
  — protected resource metadata, OAuth discovery, CIMD/DCR, PKCE, and token validation.
- Model Context Protocol, [Transports specification (2025-11-25)](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
  — Streamable HTTP session and notification behavior.
