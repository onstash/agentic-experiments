import type { Context } from "@earendil-works/pi-ai";
import type { OpportunityProfile } from "./profile.js";
import type { RankedOpportunity } from "./domain.js";
import { createCodexModels } from "./auth.js";

export async function streamRecommendation(
  profile: OpportunityProfile,
  query: string,
  opportunities: RankedOpportunity[],
): Promise<string> {
  const context: Context = {
    systemPrompt:
      "You are a concise career opportunity advisor. Use only the supplied opportunities. Explain the best matches and recommend next actions.",
    messages: [
      {
        role: "user",
        timestamp: Date.now(),
        content: JSON.stringify({ query, profile, opportunities }),
      },
    ],
  };
  let output = "";
  const models = createCodexModels();
  const model = models.getModel("openai-codex", "gpt-5.4-mini");
  if (!model) throw new Error("OpenAI Codex model is unavailable.");
  for await (const event of models.stream(model, context, { reasoningEffort: "low" })) {
    if (event.type === "text_delta") {
      output += event.delta;
      process.stdout.write(event.delta);
    }
    if (event.type === "error")
      throw new Error(event.error.errorMessage ?? "Pi model stream failed.");
  }
  process.stdout.write("\n");
  return output;
}
