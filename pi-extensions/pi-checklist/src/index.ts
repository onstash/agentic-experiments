import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { registerChecklistCommand } from "./commands.js";
import { checklistLines, renderWidget } from "./render.js";
import { replayEvents } from "./serialization.js";
import { emptyChecklist, reduceChecklist, viewChecklist } from "./store.js";
import type { Checklist, ChecklistEvent } from "./types.js";
import {
  ChecklistCreateParams,
  ChecklistReadParams,
  ChecklistUpdateParams,
  createEvents,
  taskSummary,
  updateEvents,
  type CreateParams,
  type ReadParams,
  type UpdateParams,
} from "./tools.js";

const CUSTOM_TYPE = "pi-checklist";

const PROMPT_GUIDANCE =
  "For multi-step work, use the checklist tools. Keep exactly one task ongoing; finish or cancel it before starting another. Do not start blocked tasks. Mark a task done only after a real check and include its concise command/result in verification.";

type SessionEntry = {
  type?: string;
  customType?: string;
  data?: unknown;
};

function eventsFromBranch(branch: readonly SessionEntry[]): unknown[] {
  return branch.reduce<unknown[]>((events, entry) => {
    if (entry.type === "custom" && entry.customType === CUSTOM_TYPE && entry.data !== undefined) {
      events.push(entry.data);
    }

    return events;
  }, []);
}

function persistEvents(pi: ExtensionAPI, events: readonly ChecklistEvent[]): void {
  for (const event of events) pi.appendEntry(CUSTOM_TYPE, event);
}

function applyEvents(state: Checklist, events: readonly ChecklistEvent[]): Checklist {
  return events.reduce((current, event) => reduceChecklist(current, event), state);
}

function clearChecklist(pi: ExtensionAPI): void {
  const event: ChecklistEvent = { version: 1, type: "checklist.cleared" };
  pi.appendEntry(CUSTOM_TYPE, event);
}

function result(state: Checklist, text: string) {
  return { content: [{ type: "text" as const, text }], details: state };
}

export default function piChecklist(pi: ExtensionAPI): void {
  let state = emptyChecklist();
  let resetOffered = false;

  function refreshUi(ctx: ExtensionContext): void {
    if (!ctx.hasUI) return;

    const lines = state.tasks.length ? checklistLines(state) : [];
    ctx.ui.setStatus("checklist", lines[0]);
    ctx.ui.setWidget(
      "checklist",
      lines.length === 0
        ? undefined
        : (_tui, theme) => {
            const frozen = state;

            return {
              render: (width) => renderWidget(frozen, theme, width),
              invalidate: () => {},
            };
          },
      { placement: "belowEditor" },
    );
  }

  registerChecklistCommand(pi, {
    getState: () => state,
    clear: (ctx) => {
      state = emptyChecklist();
      resetOffered = false;
      clearChecklist(pi);
      refreshUi(ctx);
    },
  });

  pi.on("session_start", (_event, ctx: ExtensionContext) => {
    // SAFETY: Pi returns session entries; this extension only reads the documented entry fields.
    const events = eventsFromBranch(ctx.sessionManager.getBranch() as SessionEntry[]);

    // SAFETY: session entries were written by this extension as ChecklistEvent values.
    state = replayEvents(events.map((event) => JSON.stringify(event)));
    refreshUi(ctx);
  });

  pi.on("before_agent_start", (event) => ({
    systemPrompt: `${event.systemPrompt}\n\n${PROMPT_GUIDANCE}`,
  }));

  pi.registerTool({
    name: "checklist_create",
    label: "Checklist Create",
    description:
      "Create a session checklist of up to five tasks. Replaces any existing checklist; requests over five tasks are rejected.",
    promptSnippet: "Create a checklist for multi-step work.",
    promptGuidelines: [PROMPT_GUIDANCE],
    parameters: ChecklistCreateParams,
    execute: async (_toolCallId, rawParams, _signal, _onUpdate, _ctx) => {
      // SAFETY: Pi validates tool arguments against ChecklistCreateParams before execute.
      const params = rawParams as CreateParams;
      const events = createEvents(params);
      state = applyEvents(emptyChecklist(), events);
      resetOffered = false;
      persistEvents(pi, events);
      refreshUi(_ctx);

      return result(state, taskSummary(state.tasks));
    },
  });

  pi.registerTool({
    name: "checklist_read",
    label: "Checklist Read",
    description:
      "Read the current session checklist, dependency readiness, and completion verification.",
    promptSnippet: "Read the current checklist.",
    promptGuidelines: ["Use checklist_read when task IDs or blocked status are uncertain."],
    parameters: ChecklistReadParams,
    execute: async (_toolCallId, rawParams) => {
      // SAFETY: Pi validates tool arguments against ChecklistReadParams before execute.
      const params = rawParams as ReadParams;

      const views = viewChecklist(state).filter(
        (task) => params.includeDone !== false || task.status !== "done",
      );

      const text = views.length
        ? views
            .map(
              (task) =>
                `${task.status === "done" ? "✓" : "○"} ${task.id} ${task.title}${task.blockedBy.length ? ` [blocked by ${task.blockedBy.join(", ")}]` : ""}${task.verification ? ` [verified: ${task.verification}]` : ""}`,
            )
            .join("\n")
        : "checklist is empty";

      return result(state, text);
    },
  });

  pi.registerTool({
    name: "checklist_update",
    label: "Checklist Update",
    description:
      "Update checklist tasks atomically. Marking done requires verification; reset premature completion with status planned.",
    promptSnippet: "Update checklist task status or details.",
    promptGuidelines: [PROMPT_GUIDANCE],
    parameters: ChecklistUpdateParams,
    execute: async (_toolCallId, rawParams, _signal, _onUpdate, ctx) => {
      // SAFETY: Pi validates tool arguments against ChecklistUpdateParams before execute.
      const params = rawParams as UpdateParams;
      const events = updateEvents(params);
      const next = applyEvents(state, events);
      state = next;
      persistEvents(pi, events);
      refreshUi(ctx);

      if (
        state.tasks.length > 0 &&
        state.tasks.every((task) => task.status === "done") &&
        !resetOffered
      ) {
        resetOffered = true;

        if (await ctx.ui.confirm("Checklist complete", "Clear this checklist?")) {
          state = emptyChecklist();
          clearChecklist(pi);
          refreshUi(ctx);
        }
      }

      return result(state, taskSummary(state.tasks));
    },
  });
}
