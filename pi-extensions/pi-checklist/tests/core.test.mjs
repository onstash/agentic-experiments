import assert from "node:assert/strict";
import test from "node:test";
import { emptyChecklist, reduceChecklist, viewChecklist } from "../dist/store.js";
import { replayEvents, serializeEvent } from "../dist/serialization.js";

const task = (id, title, dependsOn = []) => ({ id, title, status: "planned", dependsOn });

function apply(state, ...events) {
  return events.reduce(reduceChecklist, state);
}

test("enforces one ongoing task", () => {
  const state = apply(emptyChecklist(),
    { version: 1, type: "task.added", task: task("a00", "First") },
    { version: 1, type: "task.added", task: task("b00", "Second") },
    { version: 1, type: "task.updated", taskId: "a00", status: "ongoing" },
  );

  assert.throws(() => reduceChecklist(state, { version: 1, type: "task.updated", taskId: "b00", status: "ongoing" }), /Only one/);
});

test("blocks tasks until dependencies are done", () => {
  const state = apply(emptyChecklist(),
    { version: 1, type: "task.added", task: task("a00", "First") },
    { version: 1, type: "task.added", task: task("b00", "Second", ["a00"]) },
  );

  assert.equal(viewChecklist(state)[1].ready, false);
  assert.throws(() => reduceChecklist(state, { version: 1, type: "task.updated", taskId: "b00", status: "ongoing" }), /blocked/);
});

test("rejects dependency cycles", () => {
  const state = apply(
    emptyChecklist(),
    { version: 1, type: "task.added", task: task("a00", "First") },
    { version: 1, type: "task.added", task: task("b00", "Second", ["a00"]) },
  );

  assert.throws(() => reduceChecklist(state, { version: 1, type: "task.updated", taskId: "a00", dependsOn: ["b00"] }), /cycle/);
});

test("replays JSONL events", () => {
  const events = [
    { version: 1, type: "task.added", task: task("a00", "First") },
    { version: 1, type: "task.updated", taskId: "a00", status: "ongoing" },
  ];

  const state = replayEvents(events.map(serializeEvent));

  assert.equal(state.tasks[0].status, "ongoing");
});
