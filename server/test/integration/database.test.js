import { describe, expect, inject, it } from 'vitest';
import { connectDatabase } from '../../src/data/database.js';
import { createRepositories, ensureIndexes } from '../../src/data/index.js';
import { useTestDatabase } from '../helpers.js';

const getDatabase = useTestDatabase();

describe('connectDatabase', () => {
  it('connects and answers ping', async () => {
    await expect(getDatabase().ping()).resolves.toBeUndefined();
  });

  it('fails fast when the server is unreachable', async () => {
    await expect(
      connectDatabase({
        uri: 'mongodb://127.0.0.1:1',
        dbName: 'unreachable',
        serverSelectionTimeoutMS: 200,
      }),
    ).rejects.toThrow();
  });

  it('uses the configured database name', async () => {
    const database = await connectDatabase({ uri: inject('mongoUri'), dbName: 'name_check' });
    expect(database.db.databaseName).toBe('name_check');
    await database.db.dropDatabase();
    await database.close();
  });
});

describe('ensureIndexes', () => {
  async function indexesOf(name) {
    return getDatabase().db.collection(name).indexes();
  }

  it('creates TTL indexes for 90 days of request logs and two years of audit logs', async () => {
    await ensureIndexes(createRepositories(getDatabase().db));

    const requestTtl = (await indexesOf('request_logs')).find((i) => i.name === 'ttl_timestamp');
    const auditTtl = (await indexesOf('audit_logs')).find((i) => i.name === 'ttl_timestamp');
    expect(requestTtl.expireAfterSeconds).toBe(90 * 24 * 60 * 60);
    expect(auditTtl.expireAfterSeconds).toBe(730 * 24 * 60 * 60);
  });

  it('creates the audit history index and can run twice', async () => {
    const repositories = createRepositories(getDatabase().db);
    await ensureIndexes(repositories);
    await ensureIndexes(repositories);

    const names = (await indexesOf('audit_logs')).map((i) => i.name);
    expect(names).toContain('entity_history');
  });
});
