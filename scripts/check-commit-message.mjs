import { readFile } from "node:fs/promises";

export function validateCommitMessage(message) {
  if (/\\[nr]/.test(message)) {
    return "Commit message contains literal \\n or \\r escapes; use real line breaks.";
  }

  return null;
}

const input = process.argv.slice(2).find((argument) => argument !== "--");

if (input) {
  const message = await readFile(input, "utf8");
  const error = validateCommitMessage(message);

  if (error) {
    console.error(`Commit message rejected: ${error}`);
    process.exit(1);
  }

  console.log("Commit message passed.");
}
