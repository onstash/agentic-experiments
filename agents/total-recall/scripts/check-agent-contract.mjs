import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

const client = await readFile(new URL("src/life-os/http-client.ts", root), "utf8");

const worker = await readFile(new URL("src/worker.ts", root), "utf8");

const checks = [
  ["record retrieval uses the Life OS execute endpoint", client, /\/api\/private\/agent\/execute/],
  ["capability discovery uses the capabilities endpoint", client, /\/api\/private\/agent\/capabilities/],
  ["search requires the search scope", worker, /total-recall\.search/],
  ["execute requires the execute scope", worker, /total-recall\.execute/],
];

const failures = checks.filter(([, source, pattern]) => !pattern.test(source));

if (failures.length > 0) {
  console.error("Total Recall agent contract failed:");

  for (const [label] of failures) console.error(`- ${label}`);
  process.exit(1);
}

console.log(`Total Recall agent contract passed (${checks.length} checks).`);
