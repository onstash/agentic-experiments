import { Type, type TSchema } from "typebox";
import type { ChecklistEvent, Status, Task } from "./types.js";

export const ChecklistCreateParams: TSchema = Type.Object({
  tasks: Type.Array(
    Type.Object({
      id: Type.Optional(Type.String()),
      title: Type.String(),
      dependsOn: Type.Optional(Type.Array(Type.String())),
    }),
  ),
});

export const ChecklistReadParams: TSchema = Type.Object({
  includeDone: Type.Optional(Type.Boolean()),
});

export const ChecklistUpdateParams: TSchema = Type.Object({
  updates: Type.Array(
    Type.Object({
      id: Type.String(),
      title: Type.Optional(Type.String()),
      status: Type.Optional(
        Type.Union([
          Type.Literal("planned"),
          Type.Literal("ongoing"),
          Type.Literal("done"),
          Type.Literal("cancelled"),
        ]),
      ),
      dependsOn: Type.Optional(Type.Array(Type.String())),
      verification: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    }),
  ),
});

export type CreateParams = {
  tasks: Array<{ id?: string; title: string; dependsOn?: string[] }>;
};

export type ReadParams = { includeDone?: boolean };

export type UpdateParams = {
  updates: Array<{
    id: string;
    title?: string;
    status?: Status;
    dependsOn?: string[];
    verification?: string | null;
  }>;
};

export function nextTaskId(tasks: readonly Task[]): string {
  const used = new Set(tasks.map((task) => task.id));

  for (let index = 0; index < 36 ** 3; index += 1) {
    const id = index.toString(36).padStart(3, "0");

    if (!used.has(id)) return id;
  }

  throw new Error("No task IDs remain");
}

export function createEvents(input: CreateParams): ChecklistEvent[] {
  const events: ChecklistEvent[] = [{ version: 1, type: "checklist.cleared" }];
  const tasks: Task[] = [];

  for (const item of input.tasks) {
    const task: Task = {
      id: item.id ?? nextTaskId(tasks),
      title: item.title,
      status: "planned",
      dependsOn: item.dependsOn ?? [],
    };

    tasks.push(task);
    events.push({ version: 1, type: "task.added", task });
  }

  return events;
}

export function updateEvents(input: UpdateParams): ChecklistEvent[] {
  return input.updates.map((update) => {
    const event: Extract<ChecklistEvent, { type: "task.updated" }> = {
      version: 1,
      type: "task.updated",
      taskId: update.id,
    };

    if (update.title !== undefined) event.title = update.title;

    if (update.status !== undefined) event.status = update.status;

    if (update.dependsOn !== undefined) event.dependsOn = update.dependsOn;

    if (update.verification !== undefined) event.verification = update.verification;

    return event;
  });
}

export function taskSummary(tasks: readonly Task[], includeDone = true): string {
  const visible = includeDone ? tasks : tasks.filter((task) => task.status !== "done");

  if (visible.length === 0) return "checklist is empty";

  return visible
    .map((task) => `${task.status === "done" ? "✓" : "○"} ${task.id} ${task.title}`)
    .join("\n");
}
