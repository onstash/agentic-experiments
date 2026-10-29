import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const root = resolve("skills");

const requestedSkill = process.argv[2];

const entries = await readdir(root, { withFileTypes: true });

const skillDirs = entries
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((skill) => !requestedSkill || skill === requestedSkill)
  .sort();

if (requestedSkill && !skillDirs.includes(requestedSkill)) {
  throw new Error(`Unknown skill: ${requestedSkill}`);
}

const seenIds = new Set();

let evalCount = 0;

for (const skill of skillDirs) {
  const skillRoot = join(root, skill);

  const skillSource = await readFile(join(skillRoot, "SKILL.md"), "utf8");
  const evalRoot = join(skillRoot, "evals");

  const evalEntries = await readdir(evalRoot, { withFileTypes: true });

  const evalFiles = evalEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();

  if (evalFiles.length === 0) {
    throw new Error(`${skill}: no JSON eval cases found`);
  }

  if (!skillSource.includes("name:")) {
    throw new Error(`${skill}: SKILL.md is missing skill metadata`);
  }

  for (const file of evalFiles) {
    const path = join(evalRoot, file);
    const value = JSON.parse(await readFile(path, "utf8"));

    if (value.skill !== skill) {
      throw new Error(`${relative(process.cwd(), path)}: skill must be '${skill}'`);
    }

    if (!value.id || !/^[a-z0-9][a-z0-9-]*$/.test(value.id)) {
      throw new Error(`${relative(process.cwd(), path)}: id must be kebab-case`);
    }

    if (seenIds.has(value.id)) {
      throw new Error(`${relative(process.cwd(), path)}: duplicate eval id '${value.id}'`);
    }

    if (!value.scenario?.trim?.()) {
      throw new Error(`${relative(process.cwd(), path)}: scenario must be a string`);
    }

    if (!Array.isArray(value.acceptanceCriteria) || value.acceptanceCriteria.length === 0) {
      throw new Error(`${relative(process.cwd(), path)}: acceptanceCriteria must be non-empty`);
    }

    if (value.acceptanceCriteria.some((criterion) => !criterion?.trim?.())) {
      throw new Error(`${relative(process.cwd(), path)}: acceptanceCriteria must contain text`);
    }

    seenIds.add(value.id);
    evalCount += 1;
  }
}

console.log(`Validated ${evalCount} eval cases across ${skillDirs.length} skills.`);
