import assert from "node:assert/strict";
import test from "node:test";
import { piAgentConfig } from "../src/config.js";
import { evalCases, evaluateCase } from "../src/evals.js";
import { buildRuntimeInput } from "../../typescript-agent/src/runtime.js";
import { parseProfileJson, validateProfile } from "../src/profile.js";

test("Pi agent config has a bounded loop", () => {
  assert.equal(piAgentConfig.maxIterations, 3);
  assert.equal(piAgentConfig.model.provider, "openai");
});

test("runtime exposes both opportunity tools", () => {
  const runtime = buildRuntimeInput("find TypeScript jobs and OSS");
  assert.deepEqual(runtime.tools.map((tool) => tool.name), ["search_oss", "search_jobs"]);
});

test("eval cases are repeatable and pass", () => {
  assert.ok(evalCases.length >= 3);
  assert.ok(evalCases.map(evaluateCase).every((result) => result.passed));
});

test("profile JSON is validated and mapped to runtime profile fields", () => {
  const profile = parseProfileJson(JSON.stringify({ name: "Santosh", profile: "Engineer", experience_years: 11, primary_skills: ["Python"], interests: ["AI"], target_roles: ["Principal Engineer"] }));
  assert.deepEqual(profile.skills, ["Python"]);
  assert.deepEqual(profile.targetRoles, ["Principal Engineer"]);
});

test("invalid profile JSON reports schema errors", () => {
  const result = validateProfile({ name: "", primary_skills: "Python" });
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.errors.some((error) => error.includes("primary_skills")));
});
