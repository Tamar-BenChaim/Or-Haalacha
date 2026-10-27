import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createRepositories } from '../../src/data/index.js';
import { createMongoLogStore } from '../../src/logging/mongoLogStore.js';
import { createAuditService } from '../../src/services/audit.service.js';
import { buildApp, silentLogger, useTestDatabase } from '../helpers.js';

const getDatabase = useTestDatabase();
const waitForLogs = () => new Promise((resolve) => setTimeout(resolve, 100));

describe('request logs in MongoDB', () => {
  it('stores one document per request', async () => {
    const repositories = createRepositories(getDatabase().db);
    const app = buildApp({ logStore: createMongoLogStore(repositories) });

    const res = await request(app).get('/health?email=someone@example.com');
    await waitForLogs();

    const logs = await getDatabase()
      .db.collection('request_logs')
      .find({ requestId: res.headers['x-request-id'] })
      .toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ method: 'GET', path: '/health', status: 200 });
    expect(logs[0].timestamp).toBeInstanceOf(Date);
    expect(JSON.stringify(logs[0])).not.toContain('someone@example.com');
  });
});

describe('audit logs in MongoDB', () => {
  it('stores the entry with a timestamp', async () => {
    const { auditLogs } = createRepositories(getDatabase().db);
    const timestamp = new Date('2026-10-26T10:00:00Z');
    const auditService = createAuditService({
      auditLogs,
      logger: silentLogger,
      now: () => timestamp,
    });

    await auditService.record({
      actor: 'support@orhaalacha.org',
      action: 'book.update',
      entityType: 'book',
      entityId: 'book-1',
      changes: { price: { from: 60, to: 65 } },
    });

    const [entry] = await getDatabase().db.collection('audit_logs').find({}).toArray();
    expect(entry).toMatchObject({
      actor: 'support@orhaalacha.org',
      action: 'book.update',
      entityId: 'book-1',
      changes: { price: { from: 60, to: 65 } },
      timestamp,
    });
  });
});
