/* Raw JSON is parsed by the MCP server boundary. */
/* oxlint-disable anti-slop/no-unknown-parameters */

import type { JsonRpcResponse } from "../protocol/json-rpc.ts";
import { isJsonRpcNotification } from "../protocol/parse.ts";
import { handleMessage } from "../server/mcp-server.ts";

export type Authenticate = (token: string) => Promise<boolean>;

export type MessageHandler = (input: unknown) => Promise<JsonRpcResponse<unknown>>;

export function createHttpHandler({
  authenticate,
  messageHandler = handleMessage,
}: {
  authenticate: Authenticate;
  messageHandler?: MessageHandler;
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

function jsonResponse(body: JsonRpcResponse<unknown>): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}
