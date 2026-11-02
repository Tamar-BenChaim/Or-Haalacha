import { HttpError } from '../lib/httpError.js';

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH']);

/**
 * Requires a JSON content type on requests that change data. Browsers must then send
 * a CORS preflight, which other sites fail, so they cannot forge admin requests.
 */
export function requireJsonBody(req, res, next) {
  if (METHODS_WITH_BODY.has(req.method) && !req.is('application/json')) {
    return next(
      new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json'),
    );
  }
  next();
}
