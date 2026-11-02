import { isDeepStrictEqual } from 'node:util';

/**
 * Compares requested values with the current document and returns only real changes,
 * as { field: { from, to } } for the audit log.
 */
export function diffFields(current, requested) {
  const changes = {};
  for (const [field, to] of Object.entries(requested)) {
    const from = current[field] ?? null;
    if (!isDeepStrictEqual(from, to)) changes[field] = { from, to };
  }
  return changes;
}

export const changedValues = (changes) =>
  Object.fromEntries(Object.entries(changes).map(([field, { to }]) => [field, to]));
