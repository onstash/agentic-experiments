#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const file = process.argv[2];

if (!file) throw new Error("Usage: node scripts/verify-objective-proofs.mjs <report.json>");

const report = JSON.parse(await readFile(file, "utf8"));

const required = ["incident", "timeline", "evidence", "rootCauses", "actions"];

const missing = required.filter((field) => !(field in report));

const actions = Array.isArray(report.actions) ? report.actions : [];

const incompleteActions = actions.filter(
  (action) =>
    !action.owner ||
    !action.acceptanceCriterion ||
    !action.verificationMethod ||
    !action.verificationArtifact,
);

const valid = missing.length === 0 && incompleteActions.length === 0;

console.log(
  JSON.stringify(
    {
      valid,
      missing,
      incompleteActions: incompleteActions.map((action) => action.actionId ?? "unknown"),
    },
    null,
    2,
  ),
);

if (!valid) process.exitCode = 1;
