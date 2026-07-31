import fs from "node:fs";
import path from "node:path";

export type EpisodicRun = {
  query: string;
  toolCalls: string[];
  evaluations: string[];
  outcome: string;
  stopReason: string;
};

function getHumanReadableTimestamp(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function getMemoryFilePath(): string {
  return path.join(
    process.cwd(),
    "src",
    "memory",
    `episodic-memory-${getHumanReadableTimestamp()}.md`,
  );
}

function formatEpisodicRun(run: EpisodicRun): string {
  return `# Run: ${run.query}

## Query

${run.query}

## Tool Calls

${run.toolCalls.join("\n") || "- None"}

## Evaluations

${run.evaluations.join("\n") || "- None"}

## Outcome

${run.outcome}

## Stop Reason

${run.stopReason}
`;
}

export function saveEpisodicRun(run: EpisodicRun): void {
  fs.writeFileSync(getMemoryFilePath(), formatEpisodicRun(run));
}
