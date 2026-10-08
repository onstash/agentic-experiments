import {
  ChecklistError,
  STATUSES,
  type Checklist,
  type ChecklistEvent,
  type Status,
  type Task,
} from "./types.js";
import { emptyChecklist, reduceChecklist } from "./store.js";

type ParsedRecord = {
  version?: unknown;
  type?: unknown;
  task?: unknown;
  taskId?: unknown;
  title?: unknown;
  status?: unknown;
  dependsOn?: unknown;
  id?: unknown;
  message?: unknown;
  verification?: unknown;
};

function isRecord(value: unknown): value is ParsedRecord {
  // SAFETY: Object.prototype.toString confirms JSON.parse produced a plain object.
  return value !== null && Object.prototype.toString.call(value) === "[object Object]";
}

function isString(value: unknown): value is string {
  return Object.prototype.toString.call(value) === "[object String]";
}

const STATUS_SET: ReadonlySet<string> = new Set(STATUSES);

function isStatus(value: unknown): value is Status {
  return isString(value) && STATUS_SET.has(value);
}

function parseTask(value: ParsedRecord): Task {
  if (!isString(value.id) || !isString(value.title)) {
    throw new Error("invalid task");
  }

  if (!isStatus(value.status) || !Array.isArray(value.dependsOn)) {
    throw new Error("invalid task fields");
  }

  if (!value.dependsOn.every((dependency): dependency is string => isString(dependency))) {
    throw new Error("invalid task dependencies");
  }

  return {
    id: value.id,
    title: value.title,
    status: value.status,
    dependsOn: value.dependsOn,
  };
}

export function serializeEvent(event: ChecklistEvent): string {
  return JSON.stringify(event);
}

export function deserializeEvent(line: string): ChecklistEvent {
  try {
    const value: unknown = JSON.parse(line);

    if (!isRecord(value) || value.version !== 1 || !isString(value.type)) {
      throw new Error("unsupported event format");
    }

    switch (value.type) {
      case "checklist.cleared":
        return { version: 1, type: "checklist.cleared" };
      case "task.added": {
        if (!isRecord(value.task)) throw new Error("invalid task");

        return { version: 1, type: "task.added", task: parseTask(value.task) };
      }

      case "task.removed":
        if (!isString(value.taskId)) {
          throw new Error("invalid task ID");
        }

        return { version: 1, type: "task.removed", taskId: value.taskId };
      case "task.updated": {
        if (!isString(value.taskId)) {
          throw new Error("invalid task ID");
        }

        const event: Extract<ChecklistEvent, { type: "task.updated" }> = {
          version: 1,
          type: "task.updated",
          taskId: value.taskId,
        };

        if (value.title !== undefined) {
          if (!isString(value.title)) throw new Error("invalid task title");
          event.title = value.title;
        }

        if (value.status !== undefined) {
          if (!isStatus(value.status)) throw new Error("invalid task status");
          event.status = value.status;
        }

        if (value.dependsOn !== undefined) {
          if (
            !Array.isArray(value.dependsOn) ||
            !value.dependsOn.every((dependency): dependency is string => isString(dependency))
          ) {
            throw new Error("invalid task dependencies");
          }

          event.dependsOn = value.dependsOn;
        }

        if (value.verification !== undefined) {
          if (value.verification !== null && !isString(value.verification)) {
            throw new Error("invalid verification");
          }

          event.verification = value.verification;
        }

        return event;
      }

      default:
        throw new Error(`unknown event type ${value.type}`);
    }
  } catch (error) {
    const message =
      isRecord(error) && isString(error.message) ? error.message : "invalid JSONL event";

    throw new ChecklistError("invalid-event", message);
  }
}

export function replayEvents(lines: Iterable<string>): Checklist {
  let state = emptyChecklist();

  for (const [index, line] of Array.from(lines).entries()) {
    if (!line.trim()) continue;

    try {
      state = reduceChecklist(state, deserializeEvent(line));
    } catch (error) {
      if (error instanceof ChecklistError) {
        throw new ChecklistError(error.code, `Event ${index + 1}: ${error.message}`);
      }

      throw error;
    }
  }

  return state;
}

export function serializeEvents(events: Iterable<ChecklistEvent>): string {
  return Array.from(events, serializeEvent).join("\n");
}
