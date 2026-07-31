const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "in",
  "looking",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

function tokenize(userInput: string): string[] {
  return userInput
    .toLowerCase()
    .split(/\W+/)
    .map((term) => term.trim())
    .filter(Boolean)
    .filter((term) => !STOP_WORDS.has(term));
}

export function matchesQuery(fields: string[], userInput?: string): boolean {
  return scoreQueryMatch(fields, userInput) > 0;
}

export function scoreQueryMatch(fields: string[], userInput?: string): number {
  if (!userInput?.trim()) {
    return 3;
  }

  const terms = tokenize(userInput);
  const fieldTokens = new Set(tokenize(fields.join(" ")));

  if (terms.length === 0) {
    return 3;
  }

  const matchedCount = terms.filter((term) => fieldTokens.has(term)).length;
  return Math.min(10, matchedCount * 3);
}
