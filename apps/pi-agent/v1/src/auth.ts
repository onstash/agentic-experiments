import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { builtinModels } from "@earendil-works/pi-ai/providers/all";
import { openaiCodexProvider } from "@earendil-works/pi-ai/providers/openai-codex";
import { JsonCredentialStore } from "./auth-store.js";

export const authFile = new URL("../.auth/auth.json", import.meta.url).pathname;

export function createCodexModels() {
  const models = builtinModels({ credentials: new JsonCredentialStore(authFile) });
  models.setProvider(openaiCodexProvider());
  return models;
}

export async function loginCodex(): Promise<void> {
  const models = createCodexModels();
  const rl = createInterface({ input, output });
  try {
    await models.login("openai-codex", "oauth", {
      prompt: async (prompt) => {
        if (prompt.type === "select")
          return rl.question(
            `${prompt.message}\n${prompt.options.map((option) => `${option.id}: ${option.label}`).join("\n")}\n> `,
          );
        return rl.question(`${prompt.message}\n> `, { signal: prompt.signal });
      },
      notify: (event) => {
        if (event.type === "auth_url") console.log(`\nOpen this URL to sign in:\n${event.url}\n`);
        else if (event.type === "device_code")
          console.log(`\nOpen ${event.verificationUri} and enter ${event.userCode}\n`);
        else console.log(event.message);
      },
    });
  } finally {
    rl.close();
  }
  console.log(`Codex OAuth credentials saved to ${authFile}`);
}
