import type { LifeOsClient } from "../../life-os/client.ts";
import type { CallToolResult, JsonValue } from "../../protocol/tools.ts";
import { parseExecuteArguments } from "../../validation/execute.ts";

export function createExecuteHandler(client: LifeOsClient) {
  return async (args: { [key: string]: JsonValue }): Promise<CallToolResult> => {
    const parsed = parseExecuteArguments(args);

    if ("error" in parsed)
      return {
        content: [{ type: "text", text: JSON.stringify(parsed.error) }],
        structuredContent: parsed.error,
        isError: true,
      };

    const result = await client.execute(parsed.value);

    return { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result };
  };
}
