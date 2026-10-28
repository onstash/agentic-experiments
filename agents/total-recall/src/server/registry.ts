import type { Tool } from "../protocol/tools.ts";
import { executeTool } from "../tools/execute.ts";
import { searchTool } from "../tools/search.ts";

export const tools: Tool[] = [searchTool, executeTool];

export function listTools(): Tool[] {
  return tools;
}
