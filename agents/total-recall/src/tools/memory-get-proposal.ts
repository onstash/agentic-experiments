import type { Tool } from "../protocol/tools.ts";

export const memoryGetProposalTool: Tool = {
  name: "memory.get_proposal",
  description: "Retrieve a memory proposal and its current Life OS status.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["proposalId"],
    properties: { proposalId: { type: "string", minLength: 1 } },
  },
};
