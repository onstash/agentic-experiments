#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const run = (args) =>
  execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

const status = run(["status", "--short", "--branch"]);

const branch = run(["branch", "--show-current"]);

const head = run(["rev-parse", "HEAD"]);

const upstream = (() => {
  try {
    return run(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]);
  } catch {
    return null;
  }
})();

console.log(
  JSON.stringify({ branch, head, upstream, status: status.split("\n").filter(Boolean) }, null, 2),
);
