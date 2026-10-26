import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { validate } from '../../src/middleware/validate.js';
import { miniApp } from '../helpers.js';

const app = miniApp((app) => {
  app.post(
    '/items/:id',
    validate({
      params: z.object({ id: z.string().regex(/^\d+$/) }),
      body: z.object({ quantity: z.number().int().min(1) }),
    }),
    (req, res) => res.json(req.validated),
  );
});

describe('validate middleware', () => {
  it('passes parsed values on req.validated and strips unknown fields', async () => {
    const res = await request(app).post('/items/7').send({ quantity: 2, price: 1 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ params: { id: '7' }, body: { quantity: 2 } });
  });

  it('rejects invalid input with details for every failing part', async () => {
    const res = await request(app).post('/items/abc').send({ quantity: 0 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => `${d.location}:${d.path}`)).toEqual([
      'params:id',
      'body:quantity',
    ]);
  });
});
