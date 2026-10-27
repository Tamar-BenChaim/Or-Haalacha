import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../src/lib/httpError.js';
import { miniApp, silentLogger } from '../helpers.js';

describe('errorHandler', () => {
  it('returns the status and message of an HttpError', async () => {
    const app = miniApp((app) => {
      app.get('/', () => {
        throw new HttpError(409, 'OUT_OF_STOCK', 'Book is out of stock');
      });
    });

    const res = await request(app).get('/');
    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: { code: 'OUT_OF_STOCK', message: 'Book is out of stock' },
      requestId: res.headers['x-request-id'],
    });
  });

  it('hides internal error details and logs them instead', async () => {
    const logger = { ...silentLogger, error: vi.fn() };
    const app = miniApp(
      (app) => {
        app.get('/', async () => {
          throw new Error('connection string mongodb://user:pass@host');
        });
      },
      { logger },
    );

    const res = await request(app).get('/');
    expect(res.status).toBe(500);
    expect(res.body.error).toEqual({ code: 'INTERNAL_ERROR', message: 'Something went wrong' });
    expect(JSON.stringify(res.body)).not.toContain('mongodb://');
    expect(logger.error).toHaveBeenCalledOnce();
  });
});
