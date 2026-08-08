import { saveEpisodicRun } from "./memory/episodic-memory.js";
import { buildRuntimeInput, streamRuntime } from "./runtime.js";

async function main() {
  const userInput = process.argv.slice(2).join(" ").trim() || "typescript developer tools";
  const runtime = buildRuntimeInput(userInput);
  const toolCalls: string[] = [];
  const evaluations: string[] = [];
  let outcome = "";
  let stopReason = "";

  for await (const chunk of streamRuntime(runtime)) {
    console.log(JSON.stringify(chunk));
    switch (chunk.type) {
      case "tool_executed": {
        toolCalls.push(`- ${chunk.toolName} — ${chunk.resultCount} result(s)`);
        break;
      }
      case "step_evaluated": {
        evaluations.push(
          `- ${chunk.toolName} — useful: ${chunk.evaluation.useful}; shouldContinue: ${chunk.evaluation.shouldContinue}`,
        );
        break;
      }
      case "runtime_completed": {
        outcome = chunk.finalAssistantOutput;
        stopReason = chunk.stopReason;
        break;
      }
    }
  }

  saveEpisodicRun({
    query: userInput,
    toolCalls,
    evaluations,
    outcome,
    stopReason,
  });
}

main().catch((err) => {
  console.error("Error:", err);
});
