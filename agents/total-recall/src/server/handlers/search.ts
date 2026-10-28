import type { LifeOsClient } from "../../life-os/client.ts";
import type { CallToolResult, JsonValue } from "../../protocol/tools.ts";
import { parseSearchArguments } from "../../validation/search.ts";

export function createSearchHandler(client: LifeOsClient) {
  return async (args: { [key: string]: JsonValue }): Promise<CallToolResult> => {
    const parsed = parseSearchArguments(args);

    if (!parsed.valid)
      return { content: [{ type: "text", text: "Invalid search arguments." }], isError: true };

    const query = parsed.value.query ?? "";
    const limit = parsed.value.limit ?? 20;
    const result = await client.searchCapabilities({ query, limit });

    return { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result };
  };
}
