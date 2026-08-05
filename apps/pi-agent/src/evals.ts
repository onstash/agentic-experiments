import { scoreQueryMatch } from "../../typescript-agent/src/search/matches-query.js";

export type EvalCase = { name: string; query: string; expectedTerms: string[] };
export type EvalResult = EvalCase & { passed: boolean; score: number };

export const evalCases: EvalCase[] = [
  { name: "typescript query matches TypeScript", query: "typescript developer tools", expectedTerms: ["typescript"] },
  { name: "OSS query matches GitHub", query: "github open source", expectedTerms: ["github"] },
  { name: "empty query remains valid", query: "", expectedTerms: ["anything"] },
];

export function evaluateCase(testCase: EvalCase): EvalResult {
  const score = scoreQueryMatch(testCase.expectedTerms, testCase.query);
  return { ...testCase, score, passed: testCase.query === "" ? score > 0 : score > 0 };
}
