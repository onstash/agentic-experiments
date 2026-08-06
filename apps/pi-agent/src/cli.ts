import { loadProfile, parseProfileJson } from "./profile.js";
import { searchGithub } from "./github.js";
import { rank } from "./domain.js";

async function main() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf("--profile");
  const jsonIndex = args.indexOf("--profile-json");
  const profile =
    fileIndex >= 0 && args[fileIndex + 1]
      ? await loadProfile(args[fileIndex + 1])
      : jsonIndex >= 0 && args[jsonIndex + 1]
        ? parseProfileJson(args[jsonIndex + 1])
        : undefined;
  if (profile) {
    const queryIndex = args.indexOf("--query");
    const query = queryIndex >= 0 ? args[queryIndex + 1] : undefined;
    if (query)
      console.log(
        JSON.stringify(
          { query, opportunities: rank(await searchGithub(query), profile).slice(0, 20) },
          null,
          2,
        ),
      );
    else console.log(JSON.stringify(profile, null, 2));
    return;
  }
  throw new Error("Provide --profile path/to/profile.json or --profile-json '{...}'.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
