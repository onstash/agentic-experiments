import type { MemoryProposalInput, MemoryProposalResult } from "../../domain/memory.ts";
import type { LifeOsClient } from "../../life-os/client.ts";
import type { CallToolResult } from "../../protocol/tools.ts";

/* Handler arguments are validated by the dispatcher before invocation. */
/* oxlint-disable anti-slop/no-unsafe-dictionary-type */

export type ToolHandler = (args: Record<string, unknown>) => Promise<CallToolResult>;

export function createMemoryProposeHandler(client: LifeOsClient): ToolHandler {
  return async (args): Promise<CallToolResult> => {
    // SAFETY: dispatcher validates args against memory.propose before invocation.
    const result = await client.proposeMemory(args as MemoryProposalInput);

    const response: CallToolResult = {
      content: [{ type: "text", text: result.message }],
      structuredContent: result satisfies MemoryProposalResult,
    };

    if (result.status === "rejected") response.isError = true;

    return response;
  };
}

const placeholderClient: LifeOsClient = {
  async getProposal(): Promise<MemoryProposalResult> {
    throw new Error("Life OS client not configured");
  },
  async proposeMemory(): Promise<MemoryProposalResult> {
    return {
      proposalId: crypto.randomUUID(),
      status: "pending",
      message: "Review this proposal in Life OS.",
      archiveAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  },
};

export const handleMemoryPropose = createMemoryProposeHandler(placeholderClient);
