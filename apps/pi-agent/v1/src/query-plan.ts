import type { OpportunityProfile } from "./profile.js";

export type PlannedQuery = { priority: number; query: string; reason: string };

export function deriveQueries(profile: OpportunityProfile, limit = 3): PlannedQuery[] {
  if (!Number.isInteger(limit) || limit < 1)
    throw new Error("Query limit must be a positive integer.");
  const roles = profile.targetRoles.slice(0, 3);
  const interests = profile.interests.slice(0, 3);
  const skills = profile.skills.slice(0, 3);
  const candidates = [
    {
      query: `${interests[0] ?? "AI"} ${roles[0] ?? "engineer"} developer tools`,
      reason: "Matches the strongest interest and target role.",
    },
    {
      query: `${interests[1] ?? interests[0] ?? "AI"} ${roles[1] ?? roles[0] ?? "engineer"} ${skills[0] ?? "software"}`,
      reason: "Combines a core interest, role, and primary skill.",
    },
    {
      query: `${skills[1] ?? skills[0] ?? "software"} ${skills[2] ?? "platform"} ${profile.preferred_company_types?.[0] ?? "startup"}`,
      reason: "Matches technical strengths and company preference.",
    },
    {
      query: `${interests[0] ?? "AI"} developer tools ${roles[2] ?? roles[0] ?? "engineer"}`,
      reason: "Targets the primary interest in developer tools.",
    },
    {
      query: `${skills[0] ?? "software"} agent systems architecture`,
      reason: "Targets core implementation and architecture skills.",
    },
    {
      query: `frontend platform ${skills[1] ?? "React"} ${roles[0] ?? "engineer"}`,
      reason: "Targets frontend platform architecture experience.",
    },
    {
      query: `product engineer ${profile.preferred_company_types?.[1] ?? "AI startup"}`,
      reason: "Targets product ownership and preferred company type.",
    },
  ];
  return [...new Map(candidates.map((item) => [item.query.toLowerCase(), item])).values()]
    .slice(0, limit)
    .map((item, index) => ({ ...item, priority: index + 1 }));
}
