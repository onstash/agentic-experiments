import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { Credential, CredentialInfo, CredentialStore } from "@earendil-works/pi-ai";

export class JsonCredentialStore implements CredentialStore {
  constructor(private readonly filePath: string) {}
  async read(providerId: string): Promise<Credential | undefined> {
    return (await this.load())[providerId];
  }
  async list(): Promise<readonly CredentialInfo[]> {
    return Object.entries(await this.load()).map(([providerId, credential]) => ({
      providerId,
      type: credential.type,
    }));
  }
  async modify(
    providerId: string,
    fn: (current: Credential | undefined) => Promise<Credential | undefined>,
  ): Promise<Credential | undefined> {
    const credentials = await this.load();
    const next = await fn(credentials[providerId]);
    if (next) credentials[providerId] = next;
    await this.save(credentials);
    return next;
  }
  async delete(providerId: string): Promise<void> {
    const credentials = await this.load();
    delete credentials[providerId];
    await this.save(credentials);
  }
  private async load(): Promise<Record<string, Credential>> {
    try {
      return JSON.parse(await readFile(this.filePath, "utf8")) as Record<string, Credential>;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
      throw error;
    }
  }
  private async save(credentials: Record<string, Credential>): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true, mode: 0o700 });
    const temp = `${this.filePath}.tmp`;
    await writeFile(temp, `${JSON.stringify(credentials, null, 2)}\n`, { mode: 0o600 });
    await rename(temp, this.filePath);
  }
}
