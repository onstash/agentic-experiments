import type { CallToolRequest, CallToolResult, JsonObject, Tool } from "./tools.js";

export type InitializeRequest = {
  protocolVersion: string;
  capabilities?: JsonObject;
  clientInfo?: {
    name: string;
    version: string;
  };
};

export type InitializeResult = {
  protocolVersion: "2025-06-18";
  capabilities: {
    tools: JsonObject;
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
