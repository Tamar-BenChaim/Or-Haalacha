import { HttpError } from '../lib/httpError.js';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Blocks MongoDB operator injection ({ "$gt": "" }), dotted paths and
 * prototype pollution keys anywhere in the request body or query.
 */
export function rejectUnsafeKeys(req, res, next) {
  if (hasUnsafeKey(req.body) || hasUnsafeKey(req.query)) {
    return next(new HttpError(400, 'INVALID_INPUT', 'Request contains invalid field names'));
  }
  next();
}

function hasUnsafeKey(value) {
  if (Array.isArray(value)) return value.some(hasUnsafeKey);
  if (value === null || typeof value !== 'object') return false;

  return Object.keys(value).some(
    (key) =>
      key.startsWith('$') ||
      key.includes('.') ||
      FORBIDDEN_KEYS.has(key) ||
      hasUnsafeKey(value[key]),
  );
}
