import type { OpportunityProfile } from "./profile.js";
import type { RankedOpportunity } from "./domain.js";
import type { AgentSession } from "@earendil-works/pi-coding-agent";

export async function streamRecommendation(
  profile: OpportunityProfile,
  query: string,
  opportunities: RankedOpportunity[],
  session: AgentSession,
): Promise<string> {
  let output = "";
  const unsubscribe = session.subscribe((event) => {
    if (event.type !== "message_update" || event.assistantMessageEvent.type !== "text_delta")
      return;
    output += event.assistantMessageEvent.delta;
    process.stdout.write(event.assistantMessageEvent.delta);
  });
  await session.prompt(
    `You are a concise career opportunity advisor. Use only these opportunities. Explain the best matches and recommend next actions.\n\n${JSON.stringify({ query, profile, opportunities })}`,
  );
  unsubscribe();
  process.stdout.write("\n");
  return output;
}
