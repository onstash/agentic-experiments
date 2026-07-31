import { fetchRawJobHits } from "./sources/jobs.js";
import { fetchRawOssHits } from "./sources/oss.js";

export type ToolDefinition<TArgs, TResult> = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  },
  execute: (args: TArgs) => Promise<TResult>;
}

export const searchJobsTool: ToolDefinition<{ query: string }, Awaited<ReturnType<typeof fetchRawJobHits>>> = {
  name: "search_jobs",
  description: "Search for job opportunities based on a query string.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query string for job opportunities.",
      },
    },
    required: ["query"],
  },
  execute: async ({ query }) => {
    return await fetchRawJobHits(query);
  },
};

export const searchOssTool: ToolDefinition<{ query: string }, Awaited<ReturnType<typeof fetchRawOssHits>>> = {
  name: "search_oss",
  description: "Search for open-source software opportunities based on a query string.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query string for open-source software opportunities.",
      },
    },
    required: ["query"],
  },
  execute: async ({ query }) => {
    return await fetchRawOssHits(query);
  },
};

export const tools = {
  search_jobs: searchJobsTool,
  search_oss: searchOssTool,
};