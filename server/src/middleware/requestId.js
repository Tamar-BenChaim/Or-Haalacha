import { randomUUID } from 'node:crypto';

// A server-generated id lets a client error report be matched to its log entry.
export function requestId(req, res, next) {
  req.id = randomUUID();
  res.set('X-Request-Id', req.id);
  next();
}
