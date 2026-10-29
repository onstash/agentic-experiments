#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const file = process.argv[2];

if (!file) throw new Error("Usage: node scripts/check-prevention-coverage.mjs <report.json>");

const report = JSON.parse(await readFile(file, "utf8"));

const causes = Array.isArray(report.rootCauses) ? report.rootCauses : [];

const actions = Array.isArray(report.actions) ? report.actions : [];

const covered = causes.filter((cause) =>
  actions.some((action) => action.problemOrCausalEdgeAddressed === cause.id),
);

const uncovered = causes.filter((cause) => !covered.includes(cause));

console.log(
  JSON.stringify(
    {
      rootCauseCount: causes.length,
      covered: covered.map((cause) => cause.id),
      uncovered: uncovered.map((cause) => cause.id),
      valid: uncovered.length === 0,
    },
    null,
    2,
  ),
);

if (uncovered.length > 0) process.exitCode = 1;
