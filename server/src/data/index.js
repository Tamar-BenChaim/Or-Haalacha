import { createAuditLogRepository } from './auditLogs.repository.js';
import { createBookRepository } from './books.repository.js';
import { createBundleRepository } from './bundles.repository.js';
import { createRequestLogRepository } from './requestLogs.repository.js';

export function createRepositories(db) {
  return {
    books: createBookRepository(db),
    bundles: createBundleRepository(db),
    requestLogs: createRequestLogRepository(db),
    auditLogs: createAuditLogRepository(db),
  };
}

export async function ensureIndexes(repositories) {
  for (const repository of Object.values(repositories)) {
    await repository.ensureIndexes();
  }
}
