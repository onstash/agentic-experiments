import { stream } from "@earendil-works/pi-ai/compat";
import { getBuiltinModel } from "@earendil-works/pi-ai/providers/all";
import type { Context } from "@earendil-works/pi-ai";
import type { OpportunityProfile } from "./profile.js";
import type { RankedOpportunity } from "./domain.js";

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
  for await (const event of stream(getBuiltinModel("openai", "gpt-4o-mini"), context)) {
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
