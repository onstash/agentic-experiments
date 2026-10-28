import type { LifeOsClient } from "../../life-os/client.ts";
import type { CallToolResult, JsonValue } from "../../protocol/tools.ts";
import { parseExecuteArguments } from "../../validation/execute.ts";

export function createExecuteHandler(client: LifeOsClient) {
  return async (args: { [key: string]: JsonValue }): Promise<CallToolResult> => {
    const input = parseExecuteArguments(args);

    if (!input)
      return { content: [{ type: "text", text: "Invalid execute arguments." }], isError: true };

    const result = await client.execute(input);

    return { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result };
  };
}
