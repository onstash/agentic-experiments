import type { JsonRpcResponse } from "../protocol/json-rpc.ts";
import { handleMessage } from "../server/mcp-server.ts";

export type Authenticate = (token: string) => Promise<boolean>;

export function createHttpHandler({
  authenticate,
}: {
  authenticate: Authenticate;
}): (request: Request) => Promise<Response> {
  return async function handleHttpRequest(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "POST" },
      });
    }

    const token = bearerToken(request.headers.get("authorization"));

    if (!token || !(await authenticate(token))) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!request.headers.get("content-type")?.includes("application/json")) {
      return new Response("Unsupported Media Type", { status: 415 });
    }

    let input: unknown;

    try {
      input = await request.json();
    } catch {
      return jsonResponse({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      });
    }

    return jsonResponse(await handleMessage(input));
  };
}

function bearerToken(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();

  return token.length > 0 ? token : null;
}

function jsonResponse(body: JsonRpcResponse<unknown>): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}
