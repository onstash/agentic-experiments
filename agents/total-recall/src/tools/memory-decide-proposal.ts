import type { Tool } from "../protocol/tools.ts";

export const memoryDecideProposalTool: Tool = {
  name: "memory.decide_proposal",
  description: "Approve or reject a pending memory proposal in Life OS.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["proposalId", "decision"],
    properties: {
      proposalId: { type: "string", minLength: 1 },
      decision: { enum: ["approve", "reject"] },
    },
  },
};
