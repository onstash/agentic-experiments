/* JSON Schema and MCP arguments are intentionally open JSON dictionaries. */
/* oxlint-disable anti-slop/no-unsafe-dictionary-type */

export type JsonSchema = Record<string, unknown>;

export type Tool = {
  name: string;
  description?: string;
  inputSchema: JsonSchema;
  outputSchema?: JsonSchema;
};

export type CallToolRequest = {
  name: string;
  arguments?: Record<string, unknown>;
};

export type TextContent = {
  type: "text";
  text: string;
};

export type CallToolResult = {
  content: TextContent[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};
