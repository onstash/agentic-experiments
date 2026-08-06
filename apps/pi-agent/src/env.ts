const ENV_KEYS = ["GITHUB_TOKEN", "OPENAI_API_KEY"] as const;

export function checkEnv(env: NodeJS.ProcessEnv = process.env): void {
  for (const key of ENV_KEYS) {
    const value = env[key];
    if (value !== undefined && typeof value !== "string") {
      throw new TypeError(`${key} must be a string.`);
    }
    if (value !== undefined && value.trim() === "") {
      throw new Error(`${key} must not be empty when provided.`);
    }
  }
}
