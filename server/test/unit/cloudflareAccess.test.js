import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import { createAccessTokenVerifier } from '../../src/lib/cloudflareAccess.js';

const TEAM = 'https://orhaalacha.cloudflareaccess.com';
const AUDIENCE = 'test-audience-tag';

let signingKey;
let otherKey;
let verify;

beforeAll(async () => {
  // Real RS256 keys, standing in for Cloudflare's: tokens are signed and verified for real.
  const signing = await generateKeyPair('RS256', { extractable: true });
  const other = await generateKeyPair('RS256');
  signingKey = signing.privateKey;
  otherKey = other.privateKey;

  const publicJwk = await exportJWK(signing.publicKey);
  verify = createAccessTokenVerifier({
    teamDomain: TEAM,
    audience: AUDIENCE,
    keySet: createLocalJWKSet({ keys: [{ ...publicJwk, kid: 'k1', alg: 'RS256' }] }),
  });
});

function token({ key = signingKey, issuer = TEAM, audience = AUDIENCE, expiresIn = '5m' } = {}) {
  return new SignJWT({ email: 'support@orhaalacha.org' })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

describe('createAccessTokenVerifier', () => {
  it('accepts a valid token and returns its claims', async () => {
    const claims = await verify(await token());
    expect(claims.email).toBe('support@orhaalacha.org');
  });

  it.each([
    ['another audience', { audience: 'other-app' }],
    ['another issuer', { issuer: 'https://evil.cloudflareaccess.com' }],
    ['an expired token', { expiresIn: '-1m' }],
  ])('rejects %s', async (_, options) => {
    await expect(verify(await token(options))).rejects.toThrow();
  });

  it('rejects a token signed with another key', async () => {
    await expect(verify(await token({ key: otherKey }))).rejects.toThrow();
  });

  it('rejects garbage', async () => {
    await expect(verify('not-a-token')).rejects.toThrow();
  });
});
