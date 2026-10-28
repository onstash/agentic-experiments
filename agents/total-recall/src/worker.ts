import { createAccessTokenValidator } from "./auth/access-token.ts";
import { createLifeOsHttpClient } from "./life-os/http-client.ts";
import { parseJsonRpcRequest, parseToolsCallRequest } from "./protocol/parse.ts";
import type { JsonValue } from "./protocol/tools.ts";
import { createSearchHandler } from "./server/handlers/search.ts";
import { createExecuteHandler } from "./server/handlers/execute.ts";
import { createToolDispatcher } from "./server/dispatcher.ts";
import { handleSdkRequest } from "./transport/sdk.ts";

type LifeOsServiceBinding = {
  fetch: typeof fetch;
};

export type Env = {
  TOTAL_RECALL_TOKEN: string;
  LIFE_OS?: LifeOsServiceBinding;
  LIFE_OS_BASE_URL: string;
  LIFE_OS_SERVICE_TOKEN: string;
};

const MCP_RESOURCE = "https://total-recall.hastons.workers.dev/mcp";

const MEMORY_SCOPES = ["total-recall.search", "total-recall.execute"];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/.well-known/oauth-protected-resource/mcp") {
      return Promise.resolve(protectedResourceMetadata(env));
    }

    if (pathname !== "/mcp") {
      return Promise.resolve(new Response("Not Found", { status: 404 }));
    }

    const validateAccessToken = createAccessTokenValidator({
      issuer: authorizationServer(env),
      audience: MCP_RESOURCE,
      jwksUrl: new URL("/api/auth/jwks", env.LIFE_OS_BASE_URL).toString(),
      fetcher: env.LIFE_OS?.fetch.bind(env.LIFE_OS),
    });

    const lifeOsClient = createLifeOsHttpClient({
      baseUrl: env.LIFE_OS_BASE_URL,
      fetch: env.LIFE_OS?.fetch.bind(env.LIFE_OS),
      token: env.LIFE_OS_SERVICE_TOKEN,
    });

    const dispatch = createToolDispatcher({
      search: createSearchHandler(lifeOsClient),
      execute: createExecuteHandler(lifeOsClient),
    });

    const authenticate = async (token: string) => {
      if (constantTimeEqual(token, env.TOTAL_RECALL_TOKEN)) return new Set(MEMORY_SCOPES);

      return validateAccessToken(token);
    };

    const scopes = await authenticateToken(request, authenticate);

    if (!scopes) return unauthorizedResponse();

    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    const body = await request
      .clone()
      .json()
      .catch(() => null);

    const missingScopes = requiredScopesForMessage(body).filter((scope) => !scopes.has(scope));

    if (missingScopes.length > 0) return insufficientScopeResponse(missingScopes);

    return handleSdkRequest(request, dispatch);
  },
};

async function authenticateToken(
  request: Request,
  authenticate: (token: string) => Promise<ReadonlySet<string> | null>,
): Promise<ReadonlySet<string> | null> {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) return null;

  return authenticate(header.slice("Bearer ".length));
}

function unauthorizedResponse(): Response {
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Bearer resource_metadata="${MCP_RESOURCE.replace(/\/mcp$/, "")}/.well-known/oauth-protected-resource/mcp"`,
    },
  });
}

function insufficientScopeResponse(scopes: readonly string[]): Response {
  return new Response("Forbidden", {
    status: 403,
    headers: {
      "WWW-Authenticate": `Bearer error="insufficient_scope", scope="${scopes.join(" ")}"`,
    },
  });
}

function requiredScopesForMessage(input: JsonValue): readonly string[] {
  const parsed = parseJsonRpcRequest(input);

  if (!parsed.ok || parsed.request.method !== "tools/call") return [];

  const toolsCall = parseToolsCallRequest(parsed.request.params);

  if (toolsCall?.name === "search") return ["total-recall.search"];

  if (toolsCall?.name === "execute") return ["total-recall.execute"];

  return [];
}

function protectedResourceMetadata(env: Env): Response {
  return Response.json(
    {
      resource: MCP_RESOURCE,
      authorization_servers: [authorizationServer(env)],
      scopes_supported: MEMORY_SCOPES,
      bearer_methods_supported: ["header"],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}

function authorizationServer(env: Env): string {
  return new URL("/api/auth", env.LIFE_OS_BASE_URL).toString();
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return difference === 0;
}
