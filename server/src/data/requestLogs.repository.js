const DAY_SECONDS = 24 * 60 * 60;
export const REQUEST_LOG_RETENTION_DAYS = 90;

export function createRequestLogRepository(db) {
  const collection = db.collection('request_logs');

  return {
    // Changing the retention of an existing TTL index requires collMod, not createIndex.
    async ensureIndexes() {
      await collection.createIndex(
        { timestamp: 1 },
        { name: 'ttl_timestamp', expireAfterSeconds: REQUEST_LOG_RETENTION_DAYS * DAY_SECONDS },
      );
    },

    async insert(entry) {
      await collection.insertOne({ ...entry });
    },
  };
}
