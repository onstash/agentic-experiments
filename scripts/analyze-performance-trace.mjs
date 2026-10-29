#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const [, , inputPath, outputPath] = process.argv;

if (!inputPath) {
  console.error("Usage: node scripts/analyze-performance-trace.mjs <trace.json> [summary.json]");
  process.exit(1);
}

const trace = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const events = Array.isArray(trace.traceEvents) ? trace.traceEvents : [];

const metadata = trace.metadata ?? {};

const durationMs = (event) => {
  const duration = Number(event.dur ?? 0);

  return Number.isFinite(duration) ? duration / 1000 : 0;
};

const eventTimeMs = (event) => {
  const time = Number(event.ts ?? 0);

  return Number.isFinite(time) ? time / 1000 : 0;
};

const isLongTask = (event) =>
  event.name === "RunTask" && event.cat?.includes("devtools.timeline") && durationMs(event) >= 50;

const longTasks = events.filter(isLongTask);

const requests = new Map();

const userTiming = [];

const eventNames = new Map();

for (const event of events) {
  eventNames.set(event.name, (eventNames.get(event.name) ?? 0) + 1);

  if (event.name === "ResourceWillSendRequest" || event.name === "ResourceFinish") {
    const url = event.args?.data?.url ?? event.args?.url;

    if (url) {
      const entry = requests.get(url) ?? { url, starts: 0, finishes: 0, durationsMs: [] };

      if (event.name === "ResourceWillSendRequest") entry.starts += 1;

      if (event.name === "ResourceFinish") entry.finishes += 1;

      if (durationMs(event) > 0) entry.durationsMs.push(Math.round(durationMs(event)));
      requests.set(url, entry);
    }
  }

  if (event.cat?.includes("blink.user_timing") || event.name.startsWith("server-function:")) {
    userTiming.push({
      name: event.name,
      phase: event.ph,
      timeMs: Math.round(eventTimeMs(event)),
      durationMs: Math.round(durationMs(event)),
      args: event.args?.data ?? event.args ?? undefined,
    });
  }
}

const topRequestCounts = [...requests.values()]
  .sort((a, b) => b.starts + b.finishes - (a.starts + a.finishes))
  .slice(0, 25)
  .map(({ url, starts, finishes, durationsMs }) => ({
    url,
    starts,
    finishes,
    maxDurationMs: durationsMs.length ? Math.max(...durationsMs) : 0,
  }));

const topEventNames = [...eventNames.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 25)
  .map(([name, count]) => ({ name, count }));

const serverFunctionCalls = new Map();

for (const entry of userTiming) {
  const match = entry.name.match(/^server-function:(.+):(.+):(start|end)$/);

  if (!match) continue;

  const [, operation, requestId, phase] = match;
  const call = serverFunctionCalls.get(requestId) ?? { operation, requestId };

  if (phase === "start") call.startTimeMs = entry.timeMs;
  else call.endTimeMs = entry.timeMs;

  serverFunctionCalls.set(requestId, call);
}

const completedServerFunctionCalls = [...serverFunctionCalls.values()].map((call) => ({
  ...call,
  status: call.endTimeMs === undefined ? "incomplete" : "completed",
  durationMs:
    call.startTimeMs === undefined || call.endTimeMs === undefined
      ? undefined
      : call.endTimeMs - call.startTimeMs,
}));

const traceDataEvents = events.filter((event) => eventTimeMs(event) > 0);

const summary = {
  source: path.basename(inputPath),
  metadata,
  eventCount: events.length,
  timeRangeMs: traceDataEvents.length
    ? {
        start: Math.round(Math.min(...traceDataEvents.map(eventTimeMs))),
        end: Math.round(
          Math.max(...traceDataEvents.map((event) => eventTimeMs(event) + durationMs(event))),
        ),
      }
    : { start: 0, end: 0 },
  longTasks: {
    count50msOrMore: longTasks.length,
    count100msOrMore: longTasks.filter((event) => durationMs(event) >= 100).length,
    count500msOrMore: longTasks.filter((event) => durationMs(event) >= 500).length,
    maxDurationMs: longTasks.length ? Math.round(Math.max(...longTasks.map(durationMs))) : 0,
    top: longTasks
      .sort((a, b) => durationMs(b) - durationMs(a))
      .slice(0, 20)
      .map((event) => ({
        name: event.name,
        timeMs: Math.round(eventTimeMs(event)),
        durationMs: Math.round(durationMs(event)),
      })),
  },
  topRequestCounts,
  serverFunctionCalls: completedServerFunctionCalls,
  userTiming,
  topEventNames,
};

const serialized = `${JSON.stringify(summary, null, 2)}\n`;

if (outputPath) fs.writeFileSync(outputPath, serialized);
else process.stdout.write(serialized);
