import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { sendError } from './errorHandler.js';

export function securityHeaders() {
  return helmet();
}

// Origins outside the allow-list get no CORS headers, so browsers block the response.
export function corsPolicy({ corsOrigins }) {
  return cors({
    origin: [...corsOrigins],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    maxAge: 600,
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
