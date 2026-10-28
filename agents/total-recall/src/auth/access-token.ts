import { createLocalJWKSet, decodeJwt, jwtVerify, type JWTPayload } from "jose";

type ScopeClaims = JWTPayload & { scope?: string };

export type AccessTokenValidator = (token: string) => Promise<ReadonlySet<string> | null>;

export function createAccessTokenValidator({
  issuer,
  audience,
  jwksUrl,
  fetcher,
}: {
  issuer: string;
  audience: string;
  jwksUrl: string;
  fetcher?: typeof fetch;
}): AccessTokenValidator {
  const jwksEndpoint = new URL(jwksUrl);

  return async (token) => {
    try {
      const response = await (fetcher ?? fetch)(jwksEndpoint);
      console.warn("JWKS fetch", {
        status: response.status,
        contentType: response.headers.get("content-type"),
      });

      if (!response.ok) return null;

      // SAFETY: Better Auth's JWKS response is validated by jose when selecting a matching key.
      const jwks = createLocalJWKSet((await response.json()) as { keys: never[] });
      const { payload } = await jwtVerify<ScopeClaims>(token, jwks, { issuer, audience });

      return parseScopes(payload.scope);
    } catch (error) {
      const claims = decodeClaims(token);
      console.warn("OAuth access-token validation failed", {
        error: error instanceof Error ? error.name : "unknown",
        code: error instanceof Error && "code" in error ? error.code : undefined,
        message: error instanceof Error ? error.message : undefined,
        issuer: claims?.iss,
        audience: claims?.aud,
        scope: claims?.scope,
      });

      return null;
    }
  };
}

function decodeClaims(
  token: string,
): { iss?: string; aud?: string | string[]; scope?: string } | null {
  try {
    return decodeJwt(token);
  } catch {
    return null;
  }
}

function parseScopes(scope: string | undefined): ReadonlySet<string> {
  if (scope === undefined) return new Set();

  return new Set(scope.split(" ").filter((value) => value.length > 0));
}
