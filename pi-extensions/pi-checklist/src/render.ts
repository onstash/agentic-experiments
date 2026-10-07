import type { Theme } from "@earendil-works/pi-coding-agent";
import { truncateToWidth } from "@earendil-works/pi-tui";
import { viewChecklist } from "./store.js";
import type { Checklist, TaskView } from "./types.js";

export function checklistLines(state: Checklist): string[] {
  const views = viewChecklist(state);
  const done = views.filter((task) => task.status === "done").length;
  const lines = [`☑ ${done}/${views.length} done`];

  for (const task of views) lines.push(taskLine(task));

  return lines;
}

function taskLine(task: TaskView): string {
  const icon =
    task.status === "done" ? "✓" : task.status === "ongoing" ? "●" : task.ready ? "○" : "⊘";

  const blocked = task.blockedBy.length > 0 ? ` ← ${task.blockedBy.join(",")}` : "";

  return `${icon} ${task.id} ${task.title}${blocked}`;
}

export function renderWidget(state: Checklist, theme: Theme, width: number): string[] {
  return checklistLines(state).map((line, index) => {
    const color = index === 0 ? "accent" : line.startsWith("●") ? "warning" : "text";

    return truncateToWidth(theme.fg(color, line), width);
  });
}
