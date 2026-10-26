import { HttpError } from '../lib/httpError.js';

/**
 * Validates request parts against zod schemas and exposes the parsed values
 * on req.validated. Unknown fields are stripped by the schemas.
 */
export function validate(schemas) {
  return (req, res, next) => {
    const validated = {};
    const details = [];

    for (const part of ['params', 'query', 'body']) {
      if (!schemas[part]) continue;

      const result = schemas[part].safeParse(req[part] ?? {});
      if (result.success) {
        validated[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          details.push({ location: part, path: issue.path.join('.'), message: issue.message });
        }
      }
    }

    if (details.length > 0) {
      return next(new HttpError(400, 'VALIDATION_ERROR', 'Invalid request', details));
    }
    req.validated = validated;
    next();
  };
}
