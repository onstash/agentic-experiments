import assert from "node:assert/strict";
import test from "node:test";
import { piAgentConfig } from "../src/config.js";
import { evalCases, evaluateCase } from "../src/evals.js";
import { parseProfileJson, validateProfile } from "../src/profile.js";

test("Pi agent config has a bounded loop", () => {
  assert.equal(piAgentConfig.maxIterations, 3);
  assert.equal(piAgentConfig.model.provider, "openai");
});

test("profile has the fields required by local ranking", () => {
  const profile = parseProfileJson(
    JSON.stringify({
      name: "S",
      profile: "Engineer",
      experience_years: 1,
      primary_skills: ["Python"],
      interests: ["AI"],
      target_roles: ["Engineer"],
    }),
  );
  assert.deepEqual(profile.skills, ["Python"]);
  assert.deepEqual(profile.targetRoles, ["Engineer"]);
});

test("eval cases are repeatable and pass", () => {
  assert.ok(evalCases.length >= 3);
  assert.ok(evalCases.map(evaluateCase).every((result) => result.passed));
});

test("profile JSON is validated and mapped to runtime profile fields", () => {
  const profile = parseProfileJson(
    JSON.stringify({
      name: "Santosh",
      profile: "Engineer",
      experience_years: 11,
      primary_skills: ["Python"],
      interests: ["AI"],
      target_roles: ["Principal Engineer"],
    }),
  );
  assert.deepEqual(profile.skills, ["Python"]);
  assert.deepEqual(profile.targetRoles, ["Principal Engineer"]);
});

test("invalid profile JSON reports schema errors", () => {
  const result = validateProfile({ name: "", primary_skills: "Python" });
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.errors.some((error) => error.includes("primary_skills")));
});
