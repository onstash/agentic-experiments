import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import type { Checklist } from "./types.js";
import { checklistLines } from "./render.js";

export type ChecklistCommandDeps = {
  getState: () => Checklist;
  clear: (ctx: ExtensionCommandContext) => void;
};

export function registerChecklistCommand(
  pi: {
    registerCommand: (
      name: string,
      command: {
        description: string;
        handler: (args: string, ctx: ExtensionCommandContext) => Promise<void>;
      },
    ) => void;
  },
  deps: ChecklistCommandDeps,
): void {
  pi.registerCommand("checklist", {
    description: "Show or clear the session checklist",
    handler: async (args, ctx) => {
      const action = args.trim().toLowerCase();

      if (action === "clear") {
        deps.clear(ctx);
        ctx.ui.notify("checklist cleared", "info");

        return;
      }

      ctx.ui.notify(checklistLines(deps.getState()).join("\n"), "info");
    },
  });
}
