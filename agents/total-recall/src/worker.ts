import { createHttpHandler } from "./transport/http.ts";

export type Env = {
  TOTAL_RECALL_TOKEN: string;
};

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    const handleHttpRequest = createHttpHandler({
      authenticate: (token) => Promise.resolve(constantTimeEqual(token, env.TOTAL_RECALL_TOKEN)),
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
