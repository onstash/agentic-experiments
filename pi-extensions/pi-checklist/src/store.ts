import {
  ChecklistError,
  type Checklist,
  type ChecklistEvent,
  type Status,
  type Task,
  type TaskView,
  type Transition,
} from "./types.js";
import { blockedBy, isReady, MAX_TASKS, taskMap, validateDependencies } from "./graph.js";

export const emptyChecklist = (): Checklist => ({ version: 1, tasks: [] });

function assertTask(task: Task): void {
  if (!/^[a-z0-9]{3}$/.test(task.id) || !task.title.trim()) {
    throw new ChecklistError("invalid-task", `Invalid task ${task.id}`);
  }

  if (!Array.isArray(task.dependsOn)) {
    throw new ChecklistError("invalid-task", `Task ${task.id} has invalid dependencies`);
  }
}

function assertTransition(from: Status, to: Status): asserts to is Transition["to"] {
  const allowed: Record<Status, readonly Status[]> = {
    planned: ["ongoing", "done", "cancelled"],
    ongoing: ["planned", "done", "cancelled"],
    done: ["planned"],
    cancelled: ["planned"],
  };

  if (!allowed[from].includes(to)) {
    throw new ChecklistError("invalid-transition", `Cannot transition ${from} to ${to}`);
  }
}

export function reduceChecklist(state: Checklist, event: ChecklistEvent): Checklist {
  if (event.version !== 1) throw new ChecklistError("invalid-event", "Unsupported event version");
  const byId = taskMap(state.tasks);

  switch (event.type) {
    case "checklist.cleared":
      return emptyChecklist();
    case "task.added":
      assertTask(event.task);

      if (byId.has(event.task.id)) {
        throw new ChecklistError("duplicate-task", `Task ${event.task.id} already exists`);
      }

      if (state.tasks.length >= MAX_TASKS)
        throw new ChecklistError("too-many-tasks", `Maximum is ${MAX_TASKS} tasks`);
      validateDependencies([...state.tasks, event.task]);

      if (
        event.task.status === "ongoing" &&
        state.tasks.some((task) => task.status === "ongoing")
      ) {
        throw new ChecklistError("invalid-transition", "Only one task can be ongoing");
      }

      if (
        (event.task.status === "ongoing" || event.task.status === "done") &&
        !isReady(event.task, [...state.tasks, event.task])
      ) {
        throw new ChecklistError("blocked-task", `Task ${event.task.id} is blocked`);
      }

      return {
        ...state,
        tasks: [...state.tasks, { ...event.task, dependsOn: [...event.task.dependsOn] }],
      };
    case "task.updated": {
      const current = byId.get(event.taskId);

      if (!current) throw new ChecklistError("unknown-task", `Unknown task ${event.taskId}`);
      const next: Task = { ...current };

      if (event.title !== undefined) next.title = event.title;

      if (event.status !== undefined) next.status = event.status;

      if (event.dependsOn !== undefined) next.dependsOn = [...event.dependsOn];

      if (event.verification !== undefined) {
        if (event.verification === null) delete next.verification;
        else next.verification = event.verification;
      }

      assertTask(next);

      if (current.status !== next.status) assertTransition(current.status, next.status);

      if (current.status !== "done" && next.status === "done" && !next.verification?.trim()) {
        throw new ChecklistError(
          "missing-verification",
          `Task ${event.taskId} needs verification before it can be marked done`,
        );
      }

      if (next.status === "planned") delete next.verification;

      if (
        next.status === "ongoing" &&
        state.tasks.some((task) => task.id !== next.id && task.status === "ongoing")
      ) {
        throw new ChecklistError("invalid-transition", "Only one task can be ongoing");
      }

      const tasks = state.tasks.map((task) => (task.id === next.id ? next : task));

      if ((next.status === "ongoing" || next.status === "done") && !isReady(next, tasks)) {
        throw new ChecklistError("blocked-task", `Task ${event.taskId} is blocked`);
      }

      validateDependencies(tasks);

      return { ...state, tasks };
    }

    case "task.removed":
      if (!byId.has(event.taskId))
        throw new ChecklistError("unknown-task", `Unknown task ${event.taskId}`);

      if (state.tasks.some((task) => task.dependsOn.includes(event.taskId))) {
        throw new ChecklistError("invalid-task", `Task ${event.taskId} is still a dependency`);
      }

      return { ...state, tasks: state.tasks.filter((task) => task.id !== event.taskId) };
  }
}

export function viewChecklist(state: Checklist): TaskView[] {
  return state.tasks.map((task) => {
    const blocked = blockedBy(task, state.tasks);

    return { ...task, blockedBy: blocked, ready: blocked.length === 0 };
  });
}
