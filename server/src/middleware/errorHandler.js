import { HttpError } from '../lib/httpError.js';

export function sendError(req, res, status, code, message, details) {
  const error = details ? { code, message, details } : { code, message };
  res.status(status).json({ error, requestId: req.id });
}

export function notFound(req, res) {
  sendError(req, res, 404, 'NOT_FOUND', 'Resource not found');
}

/**
 * Turns any error into a JSON response. Only HttpError messages reach the client;
 * everything else is logged in full and answered with a generic message.
 */
export function errorHandler({ logger }) {
  // Express recognizes error handlers by their four arguments.
  return (err, req, res, _next) => {
    if (err instanceof HttpError) {
      return sendError(req, res, err.status, err.code, err.message, err.details);
    }
    if (err.type === 'entity.parse.failed') {
      return sendError(req, res, 400, 'INVALID_JSON', 'Request body is not valid JSON');
    }
    if (err.type === 'entity.too.large') {
      return sendError(req, res, 413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
    }

    logger.error({ err, requestId: req.id }, 'unhandled error');
    sendError(req, res, 500, 'INTERNAL_ERROR', 'Something went wrong');
  };
}
