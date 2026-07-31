import type { UserProfile } from "../profile.js";

export function scoreRelevance(topics: string[], profile: UserProfile): number {
  const topicSet = new Set(topics.map((topic) => topic.toLowerCase()));
  const profileTerms = [
    ...profile.skills,
    ...profile.interests,
    ...profile.targetRoles,
  ].map((term) => term.toLowerCase());

  let matches = 0;

  for (const term of profileTerms) {
    if (topicSet.has(term)) {
      matches += 1;
    }
  }

  return Math.min(10, matches * 3);
}