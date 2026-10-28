/* Response JSON is validated by the Life OS API contract. */

import type {
  LifeOsCapability,
  LifeOsClient,
  LifeOsProposeMemoryRequest,
  LifeOsProposeMemoryResponse,
} from "./client.ts";
import type { JsonObject } from "../protocol/tools.ts";
import { LIFE_OS_PROPOSE_MEMORY_PATH, lifeOsProposalPath } from "./client.ts";

export type LifeOsHttpClientOptions = {
  baseUrl: string;
  token: string;
  fetch?: typeof fetch;
};

export class LifeOsApiError extends Error {
  readonly responseBody: string;
  readonly status: number;
  readonly url: string;

  constructor(status: number, message: string, url: string, responseBody: string) {
    super(`${message} at ${url}: ${responseBody}`);
    this.name = "LifeOsApiError";
    this.responseBody = responseBody;
    this.status = status;
    this.url = url;
  }
}

export function createLifeOsHttpClient({
  baseUrl,
  token,
  fetch: fetchImplementation = fetch,
}: LifeOsHttpClientOptions): LifeOsClient {
  return {
    async searchCapabilities(input: {
      query?: string;
      limit?: number;
    }): Promise<{ capabilities: LifeOsCapability[] }> {
      const url = new URL("/api/private/agent/capabilities", baseUrl);

      const response = await fetchImplementation(url, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new LifeOsApiError(
          response.status,
          `Life OS capability search failed with status ${response.status}`,
          url.toString(),
          await response.text(),
        );
      }

      // SAFETY: successful responses follow the documented capability contract.
      return (await response.json()) as { capabilities: LifeOsCapability[] };
    },
    async execute(input) {
      const url = new URL("/api/private/agent/execute", baseUrl);

      const response = await fetchImplementation(url, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok)
        throw new LifeOsApiError(
          response.status,
          `Life OS execution failed with status ${response.status}`,
          url.toString(),
          await response.text(),
        );

      // SAFETY: successful responses follow the documented execution contract.
      return (await response.json()) as JsonObject;
    },
    async getProposal(proposalId: string): Promise<LifeOsProposeMemoryResponse> {
      const url = new URL(lifeOsProposalPath(proposalId), baseUrl);

      const response = await fetchImplementation(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new LifeOsApiError(
          response.status,
          `Life OS proposal lookup failed with status ${response.status}`,
          url.toString(),
          await response.text(),
        );
      }

      // SAFETY: successful responses follow the documented Life OS contract.
      return (await response.json()) as LifeOsProposeMemoryResponse;
    },

    async proposeMemory(input: LifeOsProposeMemoryRequest): Promise<LifeOsProposeMemoryResponse> {
      const url = new URL(LIFE_OS_PROPOSE_MEMORY_PATH, baseUrl);

      const response = await fetchImplementation(url, {
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
          url.toString(),
          await response.text(),
        );
      }

      // SAFETY: successful responses follow the documented Life OS contract.
      return (await response.json()) as LifeOsProposeMemoryResponse;
    },
  };
}
