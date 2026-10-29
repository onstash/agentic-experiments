#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

const [file, from, to] = process.argv.slice(2);

if (!file)
  throw new Error("Usage: node scripts/session-activity-report.mjs <rollout.jsonl> [from] [to]");

const fromMs = from ? Date.parse(from) : Number.NEGATIVE_INFINITY;

const toMs = to ? Date.parse(to) : Number.POSITIVE_INFINITY;

if (Number.isNaN(fromMs) || Number.isNaN(toMs))
  throw new Error("from and to must be ISO timestamps");

const buckets = new Map();

const lines = createInterface({
  input: createReadStream(file, { encoding: "utf8" }),
  crlfDelay: Infinity,
});

for await (const line of lines) {
  let record;

  try {
    record = JSON.parse(line);
  } catch {
    continue;
  }

  const timestamp = Date.parse(record.timestamp ?? "");

  if (Number.isNaN(timestamp) || timestamp < fromMs || timestamp >= toMs) continue;
  const start = Math.floor(timestamp / 900000) * 900000;
  const payload = record.payload ?? {};
  const bucket = buckets.get(start) ?? { events: 0, user: 0, assistant: 0 };
  bucket.events += 1;

  if (payload.role === "user") bucket.user += 1;

  if (payload.role === "assistant") bucket.assistant += 1;
  buckets.set(start, bucket);
}

for (const [start, bucket] of [...buckets.entries()].sort(([left], [right]) => left - right)) {
  console.log(
    `${new Date(start).toISOString()}  events=${bucket.events} user=${bucket.user} assistant=${bucket.assistant}`,
  );
}
