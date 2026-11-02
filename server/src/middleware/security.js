import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { sendError } from './errorHandler.js';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export function securityHeaders() {
  return helmet();
}

/**
 * Store routes accept the store origins. Admin routes accept only the admin origin,
 * with credentials, so the browser sends the Cloudflare Access cookie.
 * Origins outside these lists get no CORS headers, so browsers block the response.
 */
export function corsPolicy({ corsOrigins, admin }) {
  const storeOptions = { origin: [...corsOrigins], methods: METHODS, maxAge: 600 };
  const adminOptions = {
    origin: [admin.origin],
    methods: METHODS,
    credentials: true,
    maxAge: 600,
  };

  return cors((req, callback) => {
    const isAdminRoute = req.path === '/admin' || req.path.startsWith('/admin/');
    callback(null, isAdminRoute ? adminOptions : storeOptions);
  });
}

export function rateLimiter({ windowMs, max }) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) =>
      sendError(req, res, 429, 'RATE_LIMITED', 'Too many requests, please try again later'),
  });
}
