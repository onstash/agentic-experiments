# Life OS memory API contract

## Endpoint

```text
POST /api/private/memory/proposals
```

Total Recall calls this endpoint after MCP arguments pass validation.

## Request

The JSON body is a `MemoryProposalInput`:

```json
{
  "items": [
    {
      "class": "semantic",
      "kind": "preference",
      "content": "Prefer concise explanations.",
      "scope": { "type": "global" }
    }
  ],
  "idempotencyKey": "mcp-request-123"
}
```

The `idempotencyKey` must be forwarded unchanged. Life OS owns deduplication.

## Success response

Return a `MemoryProposalResult` directly:

```json
{
  "proposalId": "proposal-123",
  "status": "pending",
  "message": "Review this proposal in Life OS.",
  "scheduledArchiveAt": "2026-11-01T00:00:00.000Z"
}
```

## Boundary requirements

- Require private-service authentication.
- Scope the request to the Life OS owner.
- Do not activate or persist memory before approval.
- Return the existing proposal for a repeated idempotency key.
- Do not log proposal content or bearer tokens.
- Return structured JSON errors for authentication, validation, and conflicts.
