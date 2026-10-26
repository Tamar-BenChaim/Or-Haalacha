const DAY_SECONDS = 24 * 60 * 60;
export const AUDIT_LOG_RETENTION_DAYS = 730;

export function createAuditLogRepository(db) {
  const collection = db.collection('audit_logs');

  return {
    // Changing the retention of an existing TTL index requires collMod, not createIndex.
    async ensureIndexes() {
      await collection.createIndex(
        { timestamp: 1 },
        { name: 'ttl_timestamp', expireAfterSeconds: AUDIT_LOG_RETENTION_DAYS * DAY_SECONDS },
      );
      await collection.createIndex(
        { entityType: 1, entityId: 1, timestamp: -1 },
        { name: 'entity_history' },
      );
    },

    async insert(entry) {
      await collection.insertOne({ ...entry });
    },
  };
}
