import { createAuditLogRepository } from './auditLogs.repository.js';
import { createBookRepository } from './books.repository.js';
import { createRequestLogRepository } from './requestLogs.repository.js';

export function createRepositories(db) {
  return {
    books: createBookRepository(db),
    requestLogs: createRequestLogRepository(db),
    auditLogs: createAuditLogRepository(db),
  };
}

export async function ensureIndexes(repositories) {
  for (const repository of Object.values(repositories)) {
    await repository.ensureIndexes();
  }
}
