import type { JsonRpcResponse } from "../protocol/json-rpc.ts";
import { handleMessage } from "../server/mcp-server.ts";

export async function handleHttpRequest(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
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
}

function jsonResponse(body: JsonRpcResponse<unknown>): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}
