import type { JsonRpcResponse } from "../protocol/json-rpc.ts";
import type { JsonValue } from "../protocol/tools.ts";
import { isJsonRpcNotification } from "../protocol/parse.ts";
import { handleMessage } from "../server/mcp-server.ts";

export type Authenticate = (token: string) => Promise<ReadonlySet<string> | null>;

export type MessageHandler = (input: JsonValue) => Promise<JsonRpcResponse<unknown>>;

export type RequiredScopes = (input: JsonValue) => readonly string[];

export function createHttpHandler({
  authenticate,
  messageHandler = handleMessage,
  requiredScopes = () => [],
  resourceMetadataUrl,
}: {
  authenticate: Authenticate;
  messageHandler?: MessageHandler;
  requiredScopes?: RequiredScopes;
  resourceMetadataUrl?: string;
}): (request: Request) => Promise<Response> {
  return async function handleHttpRequest(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "POST" },
      });
    }

    const token = bearerToken(request.headers.get("authorization"));
    const scopes = token ? await authenticate(token) : null;

    if (!scopes) {
      return unauthorizedResponse(resourceMetadataUrl);
    }

    if (!request.headers.get("content-type")?.includes("application/json")) {
      return new Response("Unsupported Media Type", { status: 415 });
    }

    let input: JsonValue;

    try {
      input = await request.json();
    } catch {
      return jsonResponse({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      });
    }

    const missingScopes = requiredScopes(input).filter((scope) => !scopes.has(scope));

    if (missingScopes.length > 0) {
      return insufficientScopeResponse(missingScopes, resourceMetadataUrl);
    }

    if (isJsonRpcNotification(input)) {
      return new Response(null, { status: 202 });
    }

    return jsonResponse(await messageHandler(input));
  };
}

function bearerToken(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();

  return token.length > 0 ? token : null;
}

function unauthorizedResponse(resourceMetadataUrl?: string): Response {
  const headers = new Headers();

  if (resourceMetadataUrl) {
    headers.set("WWW-Authenticate", `Bearer resource_metadata="${resourceMetadataUrl}"`);
  }

  return new Response("Unauthorized", { status: 401, headers });
}

function insufficientScopeResponse(
  missingScopes: readonly string[],
  resourceMetadataUrl?: string,
): Response {
  const headers = new Headers({
    "WWW-Authenticate": `Bearer error="insufficient_scope", scope="${missingScopes.join(" ")}"`,
  });

  if (resourceMetadataUrl) {
    headers.set(
      "WWW-Authenticate",
      `Bearer resource_metadata="${resourceMetadataUrl}", error="insufficient_scope", scope="${missingScopes.join(" ")}"`,
    );
  }

  return new Response("Forbidden", { status: 403, headers });
}

function jsonResponse(body: JsonRpcResponse<unknown>): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}
