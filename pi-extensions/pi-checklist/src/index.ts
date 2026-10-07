import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { registerChecklistCommand } from "./commands.js";
import { renderWidget } from "./render.js";
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
  "For multi-step work, use the checklist tools. Keep exactly one task ongoing; finish or cancel it before starting another. Do not start blocked tasks.";

type SessionEntry = {
  type?: string;
  customType?: string;
  data?: unknown;
};

function eventsFromBranch(branch: readonly SessionEntry[]): ChecklistEvent[] {
  return branch.reduce<ChecklistEvent[]>((events, entry) => {
    if (entry.type === "custom" && entry.customType === CUSTOM_TYPE && entry.data !== undefined) {
      // SAFETY: session entries were written by this extension as ChecklistEvent values.
      events.push(entry.data as ChecklistEvent);
    }

    return events;
  }, []);
}

function persistEvents(pi: ExtensionAPI, events: readonly ChecklistEvent[]): void {
  for (const event of events) pi.appendEntry(CUSTOM_TYPE, event);
}

function applyEvents(state: Checklist, events: readonly ChecklistEvent[]): Checklist {
  return events.reduce(reduceChecklist, state);
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

  function refreshUi(ctx: ExtensionContext): void {
    if (!ctx.hasUI || state.tasks.length === 0) {
      ctx.ui.setWidget("checklist", undefined);

      return;
    }

    const frozen = state;
    ctx.ui.setWidget("checklist", (_tui, theme) => ({
      render: (width) => renderWidget(frozen, theme, width),
      invalidate: () => {},
    }));
  }

  registerChecklistCommand(pi, {
    getState: () => state,
    clear: (ctx) => {
      state = emptyChecklist();
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
    description: "Create a session checklist. Replaces any existing checklist.",
    promptSnippet: "Create a checklist for multi-step work.",
    promptGuidelines: [PROMPT_GUIDANCE],
    parameters: ChecklistCreateParams,
    execute: async (_toolCallId, rawParams, _signal, _onUpdate, _ctx) => {
      // SAFETY: Pi validates tool arguments against ChecklistCreateParams before execute.
      const params = rawParams as CreateParams;
      const events = createEvents(params);
      state = applyEvents(emptyChecklist(), events);
      persistEvents(pi, events);
      refreshUi(_ctx);

      return result(state, taskSummary(state.tasks));
    },
  });

  pi.registerTool({
    name: "checklist_read",
    label: "Checklist Read",
    description: "Read the current session checklist and dependency readiness.",
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
            .map((task) => `${task.status === "done" ? "✓" : "○"} ${task.id} ${task.title}`)
            .join("\n")
        : "checklist is empty";

      return result(state, text);
    },
  });

  pi.registerTool({
    name: "checklist_update",
    label: "Checklist Update",
    description: "Update checklist tasks atomically.",
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

      return result(state, taskSummary(state.tasks));
    },
  });
}
