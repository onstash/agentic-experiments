import type { LifeOsClient } from "../../life-os/client.ts";
import type { CallToolResult } from "../../protocol/tools.ts";
import type { ToolHandler } from "./memory-propose.ts";
import type { MemoryProposalResult } from "../../domain/memory.ts";

export function createMemoryGetProposalHandler(client: LifeOsClient): ToolHandler {
  return async (args) => {
    const result = await client.getProposal(String(args.proposalId));

    const response: CallToolResult = {
      content: [{ type: "text", text: result.message }],
      structuredContent: result satisfies MemoryProposalResult,
    };

    if (result.status === "rejected") response.isError = true;

    return response;
  };
}

export const handleMemoryGetProposal = createMemoryGetProposalHandler({
  async proposeMemory() {
    throw new Error("Life OS client not configured");
  },
  async getProposal(proposalId) {
    return {
      proposalId,
      status: "pending",
      message: "Review this proposal in Life OS.",
      archiveAt: new Date().toISOString(),
    };
  },
});
