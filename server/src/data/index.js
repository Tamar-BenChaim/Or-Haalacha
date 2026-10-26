import { createAuditLogRepository } from './auditLogs.repository.js';
import { createRequestLogRepository } from './requestLogs.repository.js';

export function createRepositories(db) {
  return {
    requestLogs: createRequestLogRepository(db),
    auditLogs: createAuditLogRepository(db),
  };
}

export async function ensureIndexes(repositories) {
  for (const repository of Object.values(repositories)) {
    await repository.ensureIndexes();
  }
}
