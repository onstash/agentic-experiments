import { appendFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export async function createRunLogger(path: string) {
  await mkdir(dirname(path), { recursive: true });
  return async (event: unknown) => {
    const data = event && typeof event === "object" ? event : { value: event };
    appendFileSync(path, `${JSON.stringify({ timestamp: new Date().toISOString(), ...data })}\n`);
  };
}
