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
total-recall.search
total-recall.execute
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

## Better Auth compatibility result

Better Auth's MCP plugin is a strong fit for this architecture. It is explicitly
an OAuth authorization server and protected-resource implementation for MCP
clients. It provides OAuth discovery, RFC 9728 protected-resource metadata,
PKCE, CIMD, token refresh/rotation, JWKS, DPoP, scope enforcement, and standard
MCP authentication challenges.

Life OS currently runs `better-auth@1.7.5`; the MCP plugin is published in
`@better-auth/mcp@1.7.13`, so the Life OS Better Auth dependency must be
upgraded before implementation. The MCP plugin also requires the Better Auth
JWT plugin and database tables for OAuth clients, access tokens, refresh tokens,
consent, and client assertions.

Cloudflare Workers require a secure CIMD fetch transport that resolves and pins
approved addresses, rejects special-use networks, and refuses redirects. This
is a required implementation detail, not an optional hardening step.

## Recommended architecture

Use Better Auth in Life OS as the authorization server. Do not add Clerk or
build a custom OAuth server.

```text
ChatGPT → Total Recall protected resource
         → Better Auth OAuth endpoints in Life OS
         → existing Google sign-in and Life OS owner identity
```

The Better Auth MCP plugin should issue tokens for the Total Recall resource.
Total Recall must publish its own protected-resource metadata that points to
Life OS as the authorization server, validate Life OS-issued tokens through
JWKS, and use the official MCP SDK v2 Streamable HTTP transport. The current
custom Total Recall transport must be replaced or made fully conformant.

`LIFE_OS_SERVICE_TOKEN` remains separate and is used only for Total Recall →
Life OS proposal calls.

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
- Better Auth, [MCP plugin](https://better-auth.com/docs/plugins/mcp) — MCP OAuth
  provider, CIMD, JWT/JWKS, scope enforcement, Worker transport constraints,
  and required OAuth schema, accessed 2026-10-25.
- Model Context Protocol, [Authorization specification (2026-07-28)](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
  — protected resource metadata, OAuth discovery, CIMD/DCR, PKCE, and token validation.
- Model Context Protocol, [Transports specification (2026-07-28)](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)
  — Streamable HTTP session and notification behavior.
