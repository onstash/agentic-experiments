export const STATUSES = ["planned", "ongoing", "done", "cancelled"] as const;

export type Status = (typeof STATUSES)[number];

export type TaskId = string;

export type AllowedTransitions = {
  planned: "ongoing" | "done" | "cancelled";
  ongoing: "planned" | "done" | "cancelled";
  done: never;
  cancelled: "planned";
};

export type Transition = {
  [From in keyof AllowedTransitions]: AllowedTransitions[From] extends never
    ? never
    : { from: From; to: AllowedTransitions[From] };
}[keyof AllowedTransitions];

export type Task = {
  id: TaskId;
  title: string;
  status: Status;
  dependsOn: TaskId[];
};

export type Checklist = {
  version: 1;
  tasks: Task[];
};

export type ChecklistEvent =
  | { version: 1; type: "task.added"; task: Task }
  | {
      version: 1;
      type: "task.updated";
      taskId: TaskId;
      title?: string;
      status?: Status;
      dependsOn?: TaskId[];
    }
  | { version: 1; type: "task.removed"; taskId: TaskId }
  | { version: 1; type: "checklist.cleared" };

export type TaskView = Task & {
  blockedBy: TaskId[];
  ready: boolean;
};

export type ChecklistErrorCode =
  | "invalid-task"
  | "duplicate-task"
  | "unknown-task"
  | "invalid-transition"
  | "blocked-task"
  | "dependency-cycle"
  | "too-many-tasks"
  | "invalid-event";

export class ChecklistError extends Error {
  constructor(
    public readonly code: ChecklistErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ChecklistError";
  }
}
