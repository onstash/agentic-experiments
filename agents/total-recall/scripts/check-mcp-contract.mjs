import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

const read = (path) => readFile(new URL(path, root), "utf8");

const [tool, validation, handler, client] = await Promise.all([
  read("src/tools/execute.ts"),
  read("src/validation/execute.ts"),
  read("src/server/handlers/execute.ts"),
  read("src/life-os/client.ts"),
]);

const checks = [
  [
    "execute documents the input envelope",
    tool,
    /Every operation must contain an id and an input object/,
  ],
  ["execute schema requires operation input", tool, /required: \["id", "input"\]/],
  [
    "runtime validation requires operation input",
    validation,
    /required: \["id", "input"\]/,
  ],
  ["operation envelope rejects unknown keys", validation, /additionalProperties: false/],
  ["validation emits structured errors", validation, /INVALID_OPERATION_INPUT/],
  ["handler returns structured validation errors", handler, /structuredContent: parsed\.error/],
  ["capabilities carry input schemas", client, /inputSchema: JsonSchema/],
];

const failures = checks.filter(([, source, pattern]) => !pattern.test(source));

if (failures.length > 0) {
  console.error("Total Recall MCP contract failed:");

  for (const [label] of failures) console.error(`- ${label}`);
  process.exit(1);
}

console.log(`Total Recall MCP contract passed (${checks.length} checks).`);
