export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export type JsonSchema = JsonObject;

export type Tool = {
  name: string;
  description?: string;
  inputSchema: JsonSchema;
  outputSchema?: JsonSchema;
};

export type CallToolRequest = {
  name: string;
  arguments?: { [key: string]: JsonValue };
};

export type TextContent = {
  type: "text";
  text: string;
};

export type CallToolResult = {
  content: TextContent[];
  structuredContent?: JsonObject;
  isError?: boolean;
};
