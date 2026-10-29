#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const files = process.argv.slice(2);

if (files.length === 0)
  throw new Error("Usage: node scripts/collect-incident-evidence.mjs <file> [...files]");

const artifacts = [];

for (const file of files) {
  const data = await readFile(file);
  artifacts.push({
    file,
    bytes: data.byteLength,
    sha256: createHash("sha256").update(data).digest("hex"),
  });
}

console.log(JSON.stringify({ collectedAt: new Date().toISOString(), artifacts }, null, 2));
