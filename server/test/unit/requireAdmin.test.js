import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { requireAdmin } from '../../src/middleware/requireAdmin.js';
import { ADMIN_EMAIL, fakeVerifyAccessToken, miniApp, silentLogger } from '../helpers.js';

function appWith(options = {}) {
  return miniApp((app) => {
    app.use(
      requireAdmin({
        verifyAccessToken: fakeVerifyAccessToken,
        adminEmails: [ADMIN_EMAIL],
        devEmail: null,
        logger: silentLogger,
        ...options,
      }),
    );
    app.get('/', (req, res) => res.json(req.admin));
  });
}

const get = (app, token) => {
  const req = request(app).get('/');
  return token ? req.set('Cf-Access-Jwt-Assertion', token) : req;
};

describe('requireAdmin', () => {
  it('lets an allowed admin through and records who it is', async () => {
    const res = await get(appWith(), 'admin-token');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ email: ADMIN_EMAIL });
  });

  it('answers 401 without a token', async () => {
    const res = await get(appWith());
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('answers 401 for an invalid token and logs why', async () => {
    const logger = { ...silentLogger, warn: vi.fn() };
    const res = await get(appWith({ logger }), 'forged');
    expect(res.status).toBe(401);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'ERR_JWS_INVALID' }),
      'rejected admin token',
    );
  });

  it('answers 403 for a valid token of an email that is not allowed', async () => {
    const res = await get(appWith(), 'stranger-token');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('compares emails case-insensitively', async () => {
    const verifyAccessToken = async () => ({ email: 'Support@OrHaalacha.org' });
    const res = await get(appWith({ verifyAccessToken }), 'any');
    expect(res.status).toBe(200);
  });

  it('rejects a token without an email claim', async () => {
    const verifyAccessToken = async () => ({ sub: 'service-token' });
    const res = await get(appWith({ verifyAccessToken }), 'any');
    expect(res.status).toBe(403);
  });

  it('uses the development email without any token when configured', async () => {
    const res = await get(appWith({ devEmail: 'dev@example.com' }));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ email: 'dev@example.com' });
  });
});
