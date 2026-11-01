import type { LifeOsClient } from "../../life-os/client.ts";
import { LifeOsApiError } from "../../life-os/http-client.ts";
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

    try {
      const result = await client.execute(parsed.value);

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
      };
    } catch (error) {
      if (!(error instanceof LifeOsApiError)) throw error;

      let response: Record<string, JsonValue> | undefined;

      try {
        const parsed: unknown = JSON.parse(error.responseBody);

        const isJsonObject =
          parsed !== null &&
          !Array.isArray(parsed) &&
          Object.prototype.toString.call(parsed) === "[object Object]";

        if (isJsonObject) {
          // SAFETY: JSON.parse plus the plain-object check guarantees a JSON object.
          response = parsed as Record<string, JsonValue>;
        }
      } catch {
        // Fall back to the raw response for non-JSON gateway errors.
      }

      const result = {
        ...response,
        code: response?.code ?? "LIFE_OS_EXECUTION_FAILED",
        message: response?.message ?? response?.error ?? error.responseBody,
        retryable: response?.retryable ?? false,
        status: error.status,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
        isError: true,
      };
    }
  };
}
