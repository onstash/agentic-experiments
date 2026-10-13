import { memoryProposeTool } from "../tools/memory-propose.ts";
import type { Tool } from "../protocol/tools.ts";

export const tools: Tool[] = [memoryProposeTool];

export function listTools(): Tool[] {
  return tools;
}
