import type { MemoryProposalInput, MemoryProposalResult } from "../domain/memory.ts";
import type { JsonObject } from "../protocol/tools.ts";

export const LIFE_OS_PROPOSE_MEMORY_PATH = "/api/private/memory/proposals";

export const lifeOsProposalPath = (proposalId: string) =>
  `${LIFE_OS_PROPOSE_MEMORY_PATH}/${encodeURIComponent(proposalId)}`;

export type LifeOsProposeMemoryRequest = MemoryProposalInput;

export type LifeOsProposeMemoryResponse = MemoryProposalResult;

export type LifeOsCapability = {
  id: string;
  description: string;
  policy: string;
  resultLimit: number;
};

export type LifeOsClient = {
  searchCapabilities(input: {
    query?: string;
    limit?: number;
  }): Promise<{ capabilities: LifeOsCapability[] }>;
  execute(input: {
    operations: Array<{ id: string; input?: JsonObject }>;
    mode: "preview" | "commit";
    idempotencyKey: string;
    conversationId?: string;
  }): Promise<JsonObject>;
  proposeMemory(input: LifeOsProposeMemoryRequest): Promise<LifeOsProposeMemoryResponse>;
  getProposal(proposalId: string): Promise<LifeOsProposeMemoryResponse>;
};
