import { getDefaultModel, type SelectedModel } from "./models/default-model.js";
import { RawJobHit } from "./normalize/jobs.js";
import { RawOssHit } from "./normalize/oss.js";
import { searchJobsTool, searchOssTool, type ToolDefinition } from "./tools.js";
import { ScoredSourceHit } from "./types.js";

export type RuntimeMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type RuntimeInput = {
  model: SelectedModel;
  systemPrompt: string;
  messages: RuntimeMessage[];
  tools: ToolDefinition<any, any>[];
};

export type RuntimeLoopOptions = {
  maxIterations: number;
};

export type StopReason =
  | "max_iterations"
  | "repeated_tool_call"
  | "low_signal_result"
  | "no_better_next_action";

export type RuntimeExecutionResult = {
  runtime: RuntimeInput;
  linearMessages: RuntimeMessage[];
  toolNames: string[];
  events: RuntimeEvent[];
  toolResults: {
    search_oss?: Awaited<ReturnType<typeof searchOssTool.execute>>;
    search_jobs?: Awaited<ReturnType<typeof searchJobsTool.execute>>;
  };
  finalAssistantOutput: string;
};

export type RuntimeEvent =
  | { type: "runtime_started" }
  | { type: "tool_selected"; toolName: string }
  | { type: "tool_executed"; toolName: string; resultCount: number }
  | { type: "runtime_completed" };

export type RuntimeStreamChunk =
  | { type: "runtime_iteration_started"; iteration: number }
  | { type: "runtime_started" }
  | { type: "tool_selected"; toolName: string }
  | {
      type: "tool_executed";
      toolName: "search_oss";
      resultCount: number;
      result: Awaited<ReturnType<typeof searchOssTool.execute>>;
    }
  | {
      type: "tool_executed";
      toolName: "search_jobs";
      resultCount: number;
      result: Awaited<ReturnType<typeof searchJobsTool.execute>>;
    }
  | {
      type: "step_evaluated";
      toolName: "search_oss" | "search_jobs";
      evaluation: {
        useful: boolean;
        shouldContinue: boolean;
      };
    }
  | {
      type: "runtime_completed";
      stopReason: StopReason;
      totalIterations: number;
      finalAssistantOutput: string;
    };

export function getDefaultLoopOptions(): RuntimeLoopOptions {
  return { maxIterations: 3 };
}

export function toLinearMessages(input: RuntimeInput): RuntimeMessage[] {
  return [{ role: "system", content: input.systemPrompt }, ...input.messages];
}

export type RuntimeExecutionInput = {
  runtime: RuntimeInput;
  linearMessages: RuntimeMessage[];
  toolNames: string[];
};

export function prepareRuntimeExecution(
  input: RuntimeInput,
): RuntimeExecutionInput {
  return {
    runtime: input,
    linearMessages: toLinearMessages(input),
    toolNames: input.tools.map((tool) => tool.name),
  };
}

export function buildRuntimeInput(userInput: string): RuntimeInput {
  return {
    model: getDefaultModel(),
    systemPrompt:
      "You are a GitHub opportunity agent that compares open source and job opportunities for a user.",
    messages: [
      {
        role: "user",
        content: userInput,
      },
    ],
    tools: [searchOssTool, searchJobsTool],
  };
}

function shouldRunTool(query: string, keywords: string[]): boolean {
  const normalizedQuery = query.toLowerCase();
  return keywords.some((keyword) => normalizedQuery.includes(keyword));
}

function getRuntimeQuery(input: RuntimeInput): string {
  const linearMessages = toLinearMessages(input);
  const userMessage = [...linearMessages]
    .reverse()
    .find((message) => message.role === "user");
  return userMessage?.content ?? "";
}

function selectToolNames(query: string): Array<"search_oss" | "search_jobs"> {
  const shouldRunOss = shouldRunTool(query, [
    "open source",
    "oss",
    "github",
    "repository",
    "repo",
  ]);
  const shouldRunJobs = shouldRunTool(query, [
    "job",
    "jobs",
    "hiring",
    "role",
    "career",
    "position",
  ]);
  const runBothTools = !shouldRunOss && !shouldRunJobs;

  const toolNames: Array<"search_oss" | "search_jobs"> = [];

  if (shouldRunOss || runBothTools) {
    toolNames.push("search_oss");
  }

  if (shouldRunJobs || runBothTools) {
    toolNames.push("search_jobs");
  }

  return toolNames;
}

type AgentDecision =
  | {
      kind: "call_tool";
      toolName: "search_oss" | "search_jobs";
      query: string;
    }
  | {
      kind: "stop";
      reason: StopReason;
    };

type RuntimeToolName = "search_oss" | "search_jobs";

function decideNextAction(
  query: string,
  candidateToolNames: Array<RuntimeToolName>,
  executedToolNames: Set<RuntimeToolName>,
): AgentDecision {
  const nextToolName = candidateToolNames.find(
    (toolName) => !executedToolNames.has(toolName),
  );
  if (!nextToolName) {
    return {
      kind: "stop",
      reason: "no_better_next_action",
    };
  }
  return {
    kind: "call_tool",
    toolName: nextToolName,
    query,
  };
}

async function executeTool(decision: AgentDecision) {
  if (decision.kind !== "call_tool") {
    throw new Error("Cannot execute tool for a non-call_tool decision");
  }
  const { toolName: nextToolName, query } = decision;
  if (nextToolName === "search_oss") {
    const result = await searchOssTool.execute({ query });
    return result;
  }
  const result = await searchJobsTool.execute({ query });
  return result;
}

type StepEvaluation = {
  useful: boolean;
  reason: string;
  shouldContinue: boolean;
};

function evaluateToolResult(
  decision: AgentDecision,
  executedToolNames: Set<RuntimeToolName>,
  candidateToolNames: Array<RuntimeToolName>,
  result: ScoredSourceHit<RawOssHit>[] | ScoredSourceHit<RawJobHit>[],
): StepEvaluation {
  if (decision.kind === "stop") {
    return {
      useful: false,
      reason: "No further tools to execute.",
      shouldContinue: false,
    };
  }

  const nextToolName = decision.toolName;
  if (executedToolNames.has(nextToolName)) {
    return {
      useful: false,
      reason: `Tool ${nextToolName} has already been executed.`,
      shouldContinue: false,
    };
  }
  executedToolNames.add(nextToolName);

  const areRemainingToolsAvailable = candidateToolNames.filter(
    (toolName) => !executedToolNames.has(toolName),
  ).length > 0;

  const areResultsAvailable = result.length > 0;

  return {
    useful: areResultsAvailable,
    reason: areResultsAvailable ? "Tool execution returned results." : "Tool execution returned no results.",
    shouldContinue: areRemainingToolsAvailable,
  };
}

export async function* streamRuntime(
  input: RuntimeInput,
  options: RuntimeLoopOptions = getDefaultLoopOptions(),
): AsyncGenerator<RuntimeStreamChunk> {
  let currentIteration = 0;
  let totalCount = 0;
  const query = getRuntimeQuery(input);
  const candidateToolNames = selectToolNames(query);

  const executedToolNames = new Set<RuntimeToolName>();
  let stopReason: StopReason = "max_iterations";

  yield { type: "runtime_started" };
  while (currentIteration < options.maxIterations) {
    currentIteration += 1;
    yield { type: "runtime_iteration_started", iteration: currentIteration };
    const decision = decideNextAction(
      query,
      candidateToolNames,
      executedToolNames,
    );
    if (decision.kind === "stop") {
      stopReason = decision.reason;
      break;
    }
    yield { type: "tool_selected", toolName: decision.toolName };
    const result = await executeTool(decision);
    if (decision.toolName === "search_oss") {
      yield {
        type: "tool_executed",
        toolName: "search_oss",
        resultCount: result.length,
        result: result as Awaited<ReturnType<typeof searchOssTool.execute>>,
      };
    } else {
      yield {
        type: "tool_executed",
        toolName: "search_jobs",
        resultCount: result.length,
        result: result as Awaited<ReturnType<typeof searchJobsTool.execute>>,
      };
    }
    totalCount += result.length;

    const evaluation = evaluateToolResult(
      decision,
      executedToolNames,
      candidateToolNames,
      result,
    );
    yield { type: "step_evaluated", toolName: decision.toolName, evaluation };
    if (!evaluation.useful && !evaluation.shouldContinue) {
      stopReason = "no_better_next_action";
      break;
    }
  }

  yield {
    type: "runtime_completed",
    finalAssistantOutput: totalCount
      ? `Found ${totalCount} ${totalCount === 1 ? "opportunity" : "opportunities"} for your query.`
      : "No opportunities found for your query.",
    stopReason,
    totalIterations: currentIteration,
  };
}
