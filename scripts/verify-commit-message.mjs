#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const commit = process.argv[2] ?? "HEAD";

const message = execFileSync("git", ["show", "-s", "--format=%B", commit], { encoding: "utf8" });

const subject = message.split(/\r?\n/, 1)[0];

const conventional =
  /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([^)]+\))?!?: .{1,72}$/u.test(
    subject,
  );

const literalEscapedNewline = /\\n/u.test(message);

const valid = conventional && !literalEscapedNewline;

console.log(
  JSON.stringify({ commit, subject, conventional, literalEscapedNewline, valid }, null, 2),
);

if (!valid) process.exitCode = 1;
