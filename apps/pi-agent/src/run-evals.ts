import { evalCases, evaluateCase } from "./evals.js";

const results = evalCases.map(evaluateCase);
console.log(
  JSON.stringify(
    {
      passed: results.filter((result) => result.passed).length,
      total: results.length,
      results,
    },
    null,
    2,
  ),
);

if (results.some((result) => !result.passed)) process.exitCode = 1;
