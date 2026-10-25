import type { MemoryProposalInput, MemoryProposalResult } from "../domain/memory.ts";

export const LIFE_OS_PROPOSE_MEMORY_PATH = "/api/private/memory/proposals";

export const lifeOsProposalPath = (proposalId: string) =>
  `${LIFE_OS_PROPOSE_MEMORY_PATH}/${encodeURIComponent(proposalId)}`;

export type LifeOsProposeMemoryRequest = MemoryProposalInput;

export type LifeOsProposeMemoryResponse = MemoryProposalResult;

export type LifeOsClient = {
  proposeMemory(input: LifeOsProposeMemoryRequest): Promise<LifeOsProposeMemoryResponse>;
  getProposal(proposalId: string): Promise<LifeOsProposeMemoryResponse>;
};
