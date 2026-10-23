import type { LifeOsClient } from "../../life-os/client.ts";
import type { CallToolResult } from "../../protocol/tools.ts";
import type { ToolHandler } from "./memory-propose.ts";

export function createMemoryDecideProposalHandler(client: LifeOsClient): ToolHandler {
  return async (args) => {
    const result = await client.decideProposal(
      String(args.proposalId),
      args.decision === "approve" ? "approve" : "reject",
    );

    return {
      content: [{ type: "text", text: result.message }],
      structuredContent: result,
    } satisfies CallToolResult;
  };
}
