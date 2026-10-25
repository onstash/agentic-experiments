import { memoryGetProposalTool } from "../tools/memory-get-proposal.ts";
import { memoryProposeTool } from "../tools/memory-propose.ts";
import type { Tool } from "../protocol/tools.ts";

export const tools: Tool[] = [memoryProposeTool, memoryGetProposalTool];

export function listTools(): Tool[] {
  return tools;
}
