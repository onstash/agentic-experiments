#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

const file = process.argv[2];

if (!file) throw new Error("Usage: node scripts/repeated-work-detector.mjs <rollout.jsonl>");

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "the",
  "to",
  "was",
  "what",
  "with",
  "you",
]);

const messages = [];

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

  const payload = record.payload ?? {};

  if (payload.role !== "user" || payload.type !== "message") continue;

  const text = (payload.content ?? [])
    .filter((item) => item.type === "input_text")
    .map((item) => item.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text || text.startsWith("Update on pull request") || text.startsWith("<skill>")) continue;

  const tokens = new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1 && !stopWords.has(token)),
  );

  messages.push({ text, tokens });
}

const clusters = [];

for (const message of messages) {
  const existing = clusters.find((cluster) => {
    const overlap = [...message.tokens].filter((token) => cluster.tokens.has(token)).length;
    const union = new Set([...message.tokens, ...cluster.tokens]).size;

    return overlap / (union || 1) >= 0.45;
  });

  if (existing) {
    existing.count += 1;
    existing.examples.push(message.text);
  } else clusters.push({ count: 1, tokens: message.tokens, examples: [message.text] });
}

for (const cluster of clusters
  .filter((item) => item.count > 1)
  .sort((left, right) => right.count - left.count)) {
  console.log(`${cluster.count} occurrences`);

  for (const example of cluster.examples.slice(0, 5)) console.log(`- ${example.slice(0, 200)}`);
}
