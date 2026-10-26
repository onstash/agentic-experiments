# RCA: ChatGPT MCP action discovery

**Date:** 2026-10-26
**Status:** Resolved

## Impact

ChatGPT completed OAuth authentication but reported `Authentication succeeded, action discovery failed`. No memory proposal could be created through the connector.

## Root cause

Total Recall validated access tokens with `jose`'s remote JWKS loader against Life OS's public JWKS URL. The URL returned `200` to an external request but `404` when fetched from the Total Recall Worker. `jose` therefore rejected the token with:

```text
ERR_JOSE_GENERIC: Expected 200 OK from the JSON Web Key Set HTTP response
```

The OAuth exchange itself was successful; MCP requests failed during bearer-token validation before MCP discovery could run.

## Contributing factors

- Public HTTP behavior was tested, but not Worker-to-Worker behavior.
- The initial MCP transport was custom rather than the official SDK transport.
- Diagnostics did not initially include JWKS response status.
- There was no authenticated end-to-end MCP discovery test.

## Resolution

- Total Recall now fetches JWKS through the Cloudflare `LIFE_OS` service binding.
- JWKS is explicitly fetched and loaded with `createLocalJWKSet`.
- Total Recall uses `@modelcontextprotocol/sdk`'s Streamable HTTP transport.
- OAuth issuer, audience, expiry, and scopes remain validated.
- The existing static Codex token remains supported.

Production logs subsequently showed:

```text
JWKS fetch { status: 200, contentType: 'application/json' }
```

The complete flow was then verified:

```text
ChatGPT → OAuth → Total Recall → Life OS proposal → Life OS approval
```

## Durable lesson

For Cloudflare Worker integrations, test service-binding requests directly. A public URL can succeed while an inter-Worker fetch to the same hostname/path returns a different status.

## Security boundary

Total Recall may propose and retrieve memory only. Approval remains exclusively in Life OS.
