import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { buildApp, memoryLogStore, silentLogger, testConfig } from '../helpers.js';

describe('GET /health', () => {
  it('responds ok with a request id', async () => {
    const res = await request(buildApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.headers['cache-control']).toBe('no-store');
  });
});

describe('security headers', () => {
  it('sets helmet headers and hides the framework', async () => {
    const res = await request(buildApp()).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('CORS', () => {
  it('allows a configured origin', async () => {
    const res = await request(buildApp()).get('/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('gives no CORS headers to other origins', async () => {
    const res = await request(buildApp()).get('/health').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('rate limiting', () => {
  it('answers 429 once the limit is reached', async () => {
    const app = buildApp({ config: testConfig({ RATE_LIMIT_MAX: '2' }) });
    await request(app).get('/health').expect(200);
    await request(app).get('/health').expect(200);

    const res = await request(app).get('/health');
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });
});

describe('request bodies', () => {
  it('rejects malformed JSON', async () => {
    const res = await request(buildApp())
      .post('/health')
      .set('Content-Type', 'application/json')
      .send('{"broken"');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('rejects bodies over the size limit', async () => {
    const res = await request(buildApp())
      .post('/health')
      .send({ text: 'x'.repeat(200 * 1024) });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('rejects NoSQL operator injection', async () => {
    const res = await request(buildApp())
      .post('/health')
      .send({ email: { $ne: null } });
    expect(res.status).toBe(400);
  });
});

describe('unknown routes', () => {
  it('returns a JSON 404', async () => {
    const res = await request(buildApp()).get('/no-such-route');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('request log', () => {
  const waitForLogs = () => new Promise((resolve) => setImmediate(resolve));

  it('records each request without the query string or full IP', async () => {
    const logStore = memoryLogStore();
    await request(buildApp({ logStore })).get('/health?phone=0501234567');
    await waitForLogs();

    expect(logStore.requestLogs).toHaveLength(1);
    const [entry] = logStore.requestLogs;
    expect(entry).toMatchObject({ method: 'GET', path: '/health', status: 200 });
    expect(entry.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(entry.durationMs).toBeGreaterThanOrEqual(0);
    expect(entry.timestamp).toBeInstanceOf(Date);
    expect(JSON.stringify(entry)).not.toContain('0501234567');
    expect(entry.ip).toMatch(/(\.0|::)$/);
  });

  it('records rejected requests too', async () => {
    const logStore = memoryLogStore();
    await request(buildApp({ logStore })).get('/missing');
    await waitForLogs();
    expect(logStore.requestLogs[0].status).toBe(404);
  });

  it('keeps serving when the log store fails', async () => {
    const logger = { ...silentLogger, error: vi.fn() };
    const logStore = { saveRequestLog: vi.fn().mockRejectedValue(new Error('db down')) };

    const res = await request(buildApp({ logger, logStore })).get('/health');
    await waitForLogs();

    expect(res.status).toBe(200);
    expect(logger.error).toHaveBeenCalledOnce();
  });
});
