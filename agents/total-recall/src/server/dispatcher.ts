import type { CallToolRequest, CallToolResult, JsonValue } from "../protocol/tools.ts";

type ToolHandler = (args: { [key: string]: JsonValue }) => Promise<CallToolResult>;

export type ToolDispatcher = (request: CallToolRequest) => Promise<CallToolResult>;

const defaultHandlers: Record<string, ToolHandler> = {};

export function createToolDispatcher(handlers: Record<string, ToolHandler>): ToolDispatcher {
  return (request) => dispatchTool(request, handlers);
}

export function callTool(request: CallToolRequest): Promise<CallToolResult> {
  return dispatchTool(request, defaultHandlers);
}

async function dispatchTool(
  request: CallToolRequest,
  handlers: Record<string, ToolHandler>,
): Promise<CallToolResult> {
  const handler = handlers[request.name];

  if (!handler) {
    return {
      content: [{ type: "text", text: `Unknown tool: ${request.name}` }],
      isError: true,
    };
  }

  const argumentsValue = request.arguments ?? {};

  return handler(argumentsValue);
}
