/* Raw JSON is parsed by the MCP server boundary. */
/* oxlint-disable anti-slop/no-unknown-parameters */

import { createLifeOsHttpClient } from "./life-os/http-client.ts";
import { createMemoryGetProposalHandler } from "./server/handlers/memory-get-proposal.ts";
import { createMemoryProposeHandler } from "./server/handlers/memory-propose.ts";
import { createToolDispatcher } from "./server/dispatcher.ts";
import { handleMessage } from "./server/mcp-server.ts";
import { createHttpHandler } from "./transport/http.ts";

export type Env = {
  TOTAL_RECALL_TOKEN: string;
  LIFE_OS_BASE_URL: string;
  LIFE_OS_TOKEN: string;
};

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    const lifeOsClient = createLifeOsHttpClient({
      baseUrl: env.LIFE_OS_BASE_URL,
      token: env.LIFE_OS_TOKEN,
    });

    const dispatch = createToolDispatcher({
      "memory.propose": createMemoryProposeHandler(lifeOsClient),
      "memory.get_proposal": createMemoryGetProposalHandler(lifeOsClient),
    });

    const messageHandler = (input: unknown) => handleMessage(input, dispatch);

    const handleHttpRequest = createHttpHandler({
      authenticate: (token) => Promise.resolve(constantTimeEqual(token, env.TOTAL_RECALL_TOKEN)),
      messageHandler,
    });

    return handleHttpRequest(request);
  },
};

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return difference === 0;
}
