/* Response JSON is validated by the Life OS API contract. */

import type {
  LifeOsClient,
  LifeOsProposeMemoryRequest,
  LifeOsProposeMemoryResponse,
} from "./client.ts";
import { LIFE_OS_PROPOSE_MEMORY_PATH, lifeOsProposalPath } from "./client.ts";

export type LifeOsHttpClientOptions = {
  baseUrl: string;
  token: string;
  fetch?: typeof fetch;
};

export class LifeOsApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "LifeOsApiError";
    this.status = status;
  }
}

export function createLifeOsHttpClient({
  baseUrl,
  token,
  fetch: fetchImplementation = fetch,
}: LifeOsHttpClientOptions): LifeOsClient {
  return {
    async decideProposal(
      proposalId: string,
      decision: "approve" | "reject",
    ): Promise<LifeOsProposeMemoryResponse> {
      const response = await fetchImplementation(
        new URL(`${lifeOsProposalPath(proposalId)}/decision`, baseUrl),
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        },
      );

      if (!response.ok) {
        throw new LifeOsApiError(
          response.status,
          `Life OS proposal decision failed with status ${response.status}`,
        );
      }

      // SAFETY: successful responses follow the documented Life OS contract.
      return (await response.json()) as LifeOsProposeMemoryResponse;
    },

    async getProposal(proposalId: string): Promise<LifeOsProposeMemoryResponse> {
      const response = await fetchImplementation(new URL(lifeOsProposalPath(proposalId), baseUrl), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new LifeOsApiError(
          response.status,
          `Life OS proposal lookup failed with status ${response.status}`,
        );
      }

      // SAFETY: successful responses follow the documented Life OS contract.
      return (await response.json()) as LifeOsProposeMemoryResponse;
    },

    async proposeMemory(input: LifeOsProposeMemoryRequest): Promise<LifeOsProposeMemoryResponse> {
      const response = await fetchImplementation(new URL(LIFE_OS_PROPOSE_MEMORY_PATH, baseUrl), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": input.idempotencyKey,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new LifeOsApiError(
          response.status,
          `Life OS memory proposal failed with status ${response.status}`,
        );
      }

      // SAFETY: successful responses follow the documented Life OS contract.
      return (await response.json()) as LifeOsProposeMemoryResponse;
    },
  };
}
