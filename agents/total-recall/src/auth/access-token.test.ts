import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";

import { exportJWK, generateKeyPair, SignJWT } from "jose";

import { createAccessTokenValidator } from "./access-token.ts";

const issuer = "https://life-os.example/api/auth";

const audience = "https://total-recall.example/mcp";

test("accepts a Life OS token with the expected issuer and resource audience", async () => {
  const { privateKey, publicKey } = await generateKeyPair("EdDSA");
  const jwk = await exportJWK(publicKey);
  jwk.kid = "life-os-key";
  jwk.alg = "EdDSA";

  const server = createServer((request, response) => {
    assert.equal(request.url, "/jwks");
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ keys: [jwk] }));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address);

  // SAFETY: listening on a TCP address returns Node's AddressInfo shape.
  const port = (address as AddressInfo).port;

  try {
    const token = await new SignJWT({ scope: "total-recall.search total-recall.execute" })
      .setProtectedHeader({ alg: "EdDSA", kid: "life-os-key" })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);

    const validate = createAccessTokenValidator({
      issuer,
      audience,
      jwksUrl: `http://127.0.0.1:${port}/jwks`,
    });

    const scopes = await validate(token);

    assert.deepEqual([...(scopes ?? [])], ["total-recall.search", "total-recall.execute"]);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("rejects invalid access tokens", async () => {
  const validate = createAccessTokenValidator({
    issuer,
    audience,
    jwksUrl: "http://127.0.0.1:1/jwks",
  });

  assert.equal(await validate("not-a-jwt"), null);
});
