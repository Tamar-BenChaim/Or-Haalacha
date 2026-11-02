import { HttpError } from '../lib/httpError.js';

export const ACCESS_TOKEN_HEADER = 'Cf-Access-Jwt-Assertion';

/**
 * Second layer of admin protection (the first is Cloudflare Access itself):
 * every admin request must carry a valid Access token for an allowed email.
 * Sets req.admin = { email } for the audit log.
 */
export function requireAdmin({ verifyAccessToken, adminEmails, devEmail, logger }) {
  return async (req, res, next) => {
    if (devEmail) {
      req.admin = { email: devEmail };
      return next();
    }

    const token = req.get(ACCESS_TOKEN_HEADER);
    if (!token) {
      return next(new HttpError(401, 'UNAUTHENTICATED', 'Authentication required'));
    }

    let claims;
    try {
      claims = await verifyAccessToken(token);
    } catch (err) {
      logger.warn({ requestId: req.id, reason: err.code ?? err.name }, 'rejected admin token');
      return next(new HttpError(401, 'UNAUTHENTICATED', 'Authentication required'));
    }

    const email = typeof claims.email === 'string' ? claims.email.toLowerCase() : null;
    if (!email || !adminEmails.includes(email)) {
      logger.warn({ requestId: req.id }, 'admin token for an email that is not allowed');
      return next(new HttpError(403, 'FORBIDDEN', 'Not allowed'));
    }

    req.admin = { email };
    next();
  };
}
