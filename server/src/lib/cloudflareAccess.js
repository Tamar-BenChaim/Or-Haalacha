import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * Verifies the signed token Cloudflare Access adds to every request it lets through
 * (header Cf-Access-Jwt-Assertion): signature against the team's public keys,
 * issuer, audience (our Access application) and expiry. Resolves to the token claims.
 */
export function createAccessTokenVerifier({
  teamDomain,
  audience,
  keySet = createRemoteJWKSet(new URL('/cdn-cgi/access/certs', teamDomain)),
}) {
  return async (token) => {
    const { payload } = await jwtVerify(token, keySet, {
      issuer: teamDomain,
      audience,
      algorithms: ['RS256'],
    });
    return payload;
  };
}

/** Used when Cloudflare Access is not configured (local development): rejects every token. */
export async function rejectAllTokens() {
  throw new Error('Cloudflare Access is not configured');
}
