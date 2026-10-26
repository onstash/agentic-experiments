import type { CallToolRequest, CallToolResult, Tool } from "./tools.js";

/* Client capabilities are an extensible protocol dictionary. */
/* oxlint-disable anti-slop/no-unsafe-dictionary-type */

export type InitializeRequest = {
  protocolVersion: string;
  capabilities?: Record<string, unknown>;
  clientInfo?: {
    name: string;
    version: string;
  };
};

export type InitializeResult = {
  protocolVersion: "2025-06-18";
  capabilities: {
    tools: Record<string, never>;
  };
  serverInfo: {
    name: "total-recall";
    version: "0.1.0";
  };
};

export type ListToolsResult = {
  tools: Tool[];
};

export type ToolsCallRequest = CallToolRequest;

export type ToolsCallResult = CallToolResult;
