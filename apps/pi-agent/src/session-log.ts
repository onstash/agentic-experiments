import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const SECRET_KEY =
  /(token|secret|password|credential|authorization|api.?key|access.?key|refresh.?token)/i;
const SECRET_VALUE = /(bearer\s+)[^\s"']+/gi;

export type SessionLogEvent = {
  type: string;
  timestamp?: string;
  [key: string]: unknown;
};

export interface SessionLogger {
  write(event: SessionLogEvent): Promise<void>;
}

export class JsonlSessionLogger implements SessionLogger {
  constructor(private readonly filePath: string) {}

  async write(event: SessionLogEvent): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true, mode: 0o700 });
    const safeEvent = redactSecrets(event) as Record<string, unknown>;
    await appendFile(
      this.filePath,
      `${JSON.stringify({ timestamp: new Date().toISOString(), ...safeEvent })}\n`,
      { mode: 0o600 },
    );
  }
}

export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        SECRET_KEY.test(key) ? "[REDACTED]" : redactSecrets(item),
      ]),
    );
  }
  if (typeof value === "string") return value.replace(SECRET_VALUE, "$1[REDACTED]");
  return value;
}
