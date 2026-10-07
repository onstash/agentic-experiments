import { ChecklistError, type Task, type TaskId } from "./types.js";

export const MAX_TASKS = 5;

export function taskMap(tasks: readonly Task[]): Map<TaskId, Task> {
  return new Map(tasks.map((task) => [task.id, task]));
}

export function blockedBy(task: Task, tasks: readonly Task[]): TaskId[] {
  const byId = taskMap(tasks);

  return task.dependsOn.filter((dependencyId) => byId.get(dependencyId)?.status !== "done");
}

export function isReady(task: Task, tasks: readonly Task[]): boolean {
  return blockedBy(task, tasks).length === 0;
}

export function validateDependencies(tasks: readonly Task[]): void {
  const byId = taskMap(tasks);

  for (const task of tasks) {
    if (new Set(task.dependsOn).size !== task.dependsOn.length) {
      throw new ChecklistError("invalid-task", `Task ${task.id} has duplicate dependencies`);
    }

    for (const dependencyId of task.dependsOn) {
      if (dependencyId === task.id) {
        throw new ChecklistError("dependency-cycle", `Task ${task.id} depends on itself`);
      }

      if (!byId.has(dependencyId)) {
        throw new ChecklistError(
          "unknown-task",
          `Task ${task.id} depends on unknown task ${dependencyId}`,
        );
      }
    }
  }

  const visiting = new Set<TaskId>();
  const visited = new Set<TaskId>();

  function visit(taskId: TaskId): void {
    if (visiting.has(taskId)) {
      throw new ChecklistError("dependency-cycle", `Dependency cycle includes ${taskId}`);
    }

    if (visited.has(taskId)) return;

    visiting.add(taskId);

    for (const dependencyId of byId.get(taskId)?.dependsOn ?? []) visit(dependencyId);
    visiting.delete(taskId);
    visited.add(taskId);
  }

  for (const task of tasks) visit(task.id);
}
