#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const [ownerRepo, number] = process.argv.slice(2);

if (!ownerRepo || !number)
  throw new Error("Usage: node scripts/verify-pr-readiness.mjs <owner/repo> <number>");

const output = execFileSync(
  "gh",
  [
    "pr",
    "view",
    number,
    "--repo",
    ownerRepo,
    "--json",
    "url,state,isDraft,mergeable,headRefOid,statusCheckRollup,reviews",
  ],
  { encoding: "utf8" },
);

const pr = JSON.parse(output);

const checks = (pr.statusCheckRollup ?? []).map((check) => ({
  name: check.name ?? check.context,
  state: check.state ?? check.conclusion,
  url: check.detailsUrl ?? check.targetUrl,
}));

const failed = checks.filter((check) => ["FAILURE", "ERROR", "CANCELLED"].includes(check.state));

console.log(
  JSON.stringify(
    {
      ...pr,
      checks,
      ready:
        pr.state === "OPEN" && !pr.isDraft && pr.mergeable === "MERGEABLE" && failed.length === 0,
    },
    null,
    2,
  ),
);

if (failed.length > 0) process.exitCode = 1;
