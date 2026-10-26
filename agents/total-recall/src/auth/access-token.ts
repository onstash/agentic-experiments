/* OAuth token claims enter from an external authorization server. */
/* oxlint-disable anti-slop/no-runtime-typeof, anti-slop/no-unknown-parameters, anti-slop/require-readable-spacing */

import { createRemoteJWKSet, jwtVerify } from "jose";

export type AccessTokenValidator = (token: string) => Promise<ReadonlySet<string> | null>;

export function createAccessTokenValidator({
  issuer,
  audience,
  jwksUrl,
}: {
  issuer: string;
  audience: string;
  jwksUrl: string;
}): AccessTokenValidator {
  const jwks = createRemoteJWKSet(new URL(jwksUrl));

  return async (token) => {
    try {
      const { payload } = await jwtVerify(token, jwks, { issuer, audience });
      return parseScopes(payload.scope);
    } catch {
      return null;
    }
  };
}

function parseScopes(scope: unknown): ReadonlySet<string> {
  if (typeof scope !== "string") return new Set();

  return new Set(scope.split(" ").filter((value) => value.length > 0));
}
