import type { MemoryProposalInput, MemoryProposalResult } from "../domain/memory.ts";

export const LIFE_OS_PROPOSE_MEMORY_PATH = "/api/private/memory/proposals";

export type LifeOsProposeMemoryRequest = MemoryProposalInput;

export type LifeOsProposeMemoryResponse = MemoryProposalResult;

export type LifeOsClient = {
  proposeMemory(input: LifeOsProposeMemoryRequest): Promise<LifeOsProposeMemoryResponse>;
};
