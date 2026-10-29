import { readFile } from "node:fs/promises";

const path = process.argv[2];

if (!path) {
  throw new Error("Usage: node scripts/verify-skill-frontmatter.mjs <SKILL.md>");
}

const source = await readFile(path, "utf8");

if (!source.startsWith("---\n") || !source.includes("\n---\n")) {
  throw new Error(`${path}: missing YAML frontmatter`);
}

const { name, description } = (() => {
  const value = source.slice(4, source.indexOf("\n---\n"));

  return {
    name: value.match(/^name:\s*([^\n]+)$/m)?.[1]?.trim(),
    description: value.match(/^description:\s*([^\n]+)$/m)?.[1]?.trim(),
  };
})();

if (!name || !description) {
  throw new Error(`${path}: frontmatter requires name and description`);
}

const expected = path.split("/").at(-2);

if (name !== expected) {
  throw new Error(`${path}: name '${name}' must match directory '${expected}'`);
}

console.log(`${path}: valid (${name})`);
