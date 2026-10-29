#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const file = process.argv[2];

if (!file) throw new Error("Usage: node scripts/build-incident-timeline.mjs <events.json>");

const events = JSON.parse(await readFile(file, "utf8"));

if (!Array.isArray(events)) throw new Error("Input must be a JSON array of events");

const timeline = events
  .map((event, index) => ({
    id: event.id ?? `event-${index + 1}`,
    timestamp: event.timestamp,
    timezone: event.timezone ?? "unknown",
    summary: event.summary,
    source: event.source,
    status: event.status ?? "observed",
  }))
  .sort((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp));

console.log(JSON.stringify({ eventCount: timeline.length, timeline }, null, 2));
