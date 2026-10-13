import type { MemoryProposalResult } from "../../domain/memory.ts";
/* Handler arguments are already validated at the dispatcher boundary. */
/* oxlint-disable anti-slop/no-unsafe-dictionary-type */

import type { CallToolResult } from "../../protocol/tools.ts";

export async function handleMemoryPropose(_args: Record<string, unknown>): Promise<CallToolResult> {
  const result: MemoryProposalResult = {
    proposalId: crypto.randomUUID(),
    status: "pending",
    message: "Review this proposal in Life OS.",
    scheduledArchiveAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  return {
    content: [
      {
        type: "text",
        text: "Proposal created. No memory was changed.",
      },
    ],
    structuredContent: result,
  };
}
