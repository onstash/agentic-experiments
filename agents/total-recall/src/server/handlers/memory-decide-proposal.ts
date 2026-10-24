import { LifeOsApiError } from "../../life-os/http-client.ts";
import type { LifeOsClient } from "../../life-os/client.ts";
import type { CallToolResult } from "../../protocol/tools.ts";
import type { ToolHandler } from "./memory-propose.ts";

export function createMemoryDecideProposalHandler(client: LifeOsClient): ToolHandler {
  return async (args) => {
    try {
      const result = await client.decideProposal(
        String(args.proposalId),
        args.decision === "approve" ? "approve" : "reject",
      );

      return {
        content: [{ type: "text", text: result.message }],
        structuredContent: result,
      } satisfies CallToolResult;
    } catch (error) {
      if (error instanceof LifeOsApiError && error.status === 404) {
        return {
          content: [{ type: "text", text: "Proposal not found or already decided." }],
          isError: true,
        };
      }

      throw error;
    }
  };
}
