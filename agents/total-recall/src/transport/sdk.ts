import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { CallToolRequest, CallToolResult } from "../protocol/tools.ts";

import { listTools } from "../server/registry.ts";

export async function handleSdkRequest(
  request: Request,
  dispatch: (input: CallToolRequest) => Promise<CallToolResult>,
): Promise<Response> {
  const server = new Server(
    { name: "total-recall", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: listTools() }));
  server.setRequestHandler(CallToolRequestSchema, async (input) => {
    // SAFETY: the MCP SDK has validated the request as a JSON object before dispatch.
    return dispatch(input.params as CallToolRequest);
  });

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  const headers = new Headers(request.headers);
  headers.set("accept", "application/json, text/event-stream");
  request = new Request(request, { headers });

  return transport.handleRequest(request);
}
