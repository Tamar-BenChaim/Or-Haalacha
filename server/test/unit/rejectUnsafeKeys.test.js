import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { rejectUnsafeKeys } from '../../src/middleware/rejectUnsafeKeys.js';
import { miniApp } from '../helpers.js';

const app = miniApp((app) => {
  app.use(rejectUnsafeKeys);
  app.post('/', (req, res) => res.json({ ok: true }));
});

describe('rejectUnsafeKeys middleware', () => {
  it('allows ordinary input', async () => {
    const res = await request(app)
      .post('/')
      .send({ name: 'x', items: [{ id: 1 }] });
    expect(res.status).toBe(200);
  });

  it.each([
    ['an operator key', { phone: { $ne: '' } }],
    ['a nested operator in an array', { items: [{ id: { $gt: 0 } }] }],
    ['a dotted key', { 'customer.email': 'x' }],
    ['a prototype pollution key', JSON.parse('{"__proto__": {"admin": true}}')],
    ['a constructor key', { constructor: { prototype: {} } }],
  ])('rejects %s', async (_, body) => {
    const res = await request(app).post('/').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });

  it('rejects operator keys in the query string', async () => {
    const res = await request(app).post('/?$where=1');
    expect(res.status).toBe(400);
  });
});
