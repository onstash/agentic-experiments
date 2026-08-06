import { readFile } from "node:fs/promises";
export type UserProfile = { skills: string[]; interests: string[]; targetRoles: string[] };

export type OpportunityProfile = UserProfile & {
  name: string;
  profile: string;
  experience_years: number;
  additional_skills?: string[];
  leadership_experience?: string[];
  preferred_company_stage?: string[];
  preferred_company_types?: string[];
  work_preferences?: string[];
  notable_impact?: string[];
};

export type ProfileValidationResult =
  | { valid: true; profile: OpportunityProfile }
  | { valid: false; errors: string[] };

const requiredStrings = ["name", "profile"] as const;
const requiredArrays = ["primary_skills", "interests", "target_roles"] as const;

export function validateProfile(input: unknown): ProfileValidationResult {
  const errors: string[] = [];
  if (!isRecord(input)) return { valid: false, errors: ["Profile must be a JSON object."] };
  for (const field of requiredStrings)
    if (typeof input[field] !== "string" || !input[field].trim())
      errors.push(`${field} must be a non-empty string.`);
  if (typeof input.experience_years !== "number" || input.experience_years < 0)
    errors.push("experience_years must be a non-negative number.");
  for (const field of requiredArrays)
    if (!isStringArray(input[field])) errors.push(`${field} must be an array of strings.`);
  for (const field of [
    "additional_skills",
    "leadership_experience",
    "preferred_company_stage",
    "preferred_company_types",
    "work_preferences",
    "notable_impact",
  ] as const) {
    if (input[field] !== undefined && !isStringArray(input[field]))
      errors.push(`${field} must be an array of strings when provided.`);
  }
  if (errors.length) return { valid: false, errors };
  return {
    valid: true,
    profile: {
      ...input,
      skills: input.primary_skills,
      targetRoles: input.target_roles,
    } as OpportunityProfile,
  };
}

export function parseProfileJson(json: string): OpportunityProfile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Profile input is not valid JSON.");
  }
  const result = validateProfile(parsed);
  if (!result.valid) throw new Error(`Invalid profile:\n- ${result.errors.join("\n- ")}`);
  return result.profile;
}

export async function loadProfile(path: string): Promise<OpportunityProfile> {
  return parseProfileJson(await readFile(path, "utf8"));
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
