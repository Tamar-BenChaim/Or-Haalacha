import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createRepositories, ensureIndexes } from '../../src/data/index.js';
import { seedSampleData } from '../../src/data/seed.js';
import { buildApp, useTestDatabase } from '../helpers.js';

const getDatabase = useTestDatabase();
let app;

beforeAll(async () => {
  const repositories = createRepositories(getDatabase().db);
  await ensureIndexes(repositories);
  await seedSampleData(repositories);
  app = buildApp({ repositories });
});

const quote = (items) => request(app).post('/cart/quote').send({ items });

describe('GET /bundles', () => {
  it('lists the full set with its saving and included books', async () => {
    const res = await request(app).get('/bundles');

    expect(res.status).toBe(200);
    const [bundle] = res.body.bundles;
    expect(bundle).toMatchObject({
      slug: 'full-set',
      priceAgorot: 22000,
      separatePriceAgorot: 4 * 6500,
      // Volume 4 of the sample data is out of stock.
      inStock: false,
    });
    expect(bundle.books.map((b) => b.slug)).toEqual([
      'or-haalacha-1',
      'or-haalacha-2',
      'or-haalacha-3',
      'or-haalacha-4',
    ]);
  });
});

describe('POST /cart/quote', () => {
  it('recalculates prices from the database and ignores prices sent by the browser', async () => {
    const res = await quote([{ type: 'book', slug: 'or-haalacha-1', quantity: 2, priceAgorot: 1 }]);

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.items[0]).toMatchObject({ unitPriceAgorot: 6500, lineTotalAgorot: 13000 });
    expect(res.body).toMatchObject({ subtotalAgorot: 13000, allAvailable: true });
  });

  it('reports out-of-stock, hidden and limited lines', async () => {
    const res = await quote([
      { type: 'book', slug: 'or-haalacha-4', quantity: 1 },
      { type: 'book', slug: 'or-haalacha-5', quantity: 1 },
      { type: 'book', slug: 'or-haalacha-2', quantity: 50 },
    ]);

    expect(res.body.items.map((i) => i.status)).toEqual(['out_of_stock', 'unavailable', 'limited']);
    expect(res.body.items[2].quantity).toBe(20);
    expect(res.body.allAvailable).toBe(false);
  });

  it.each([
    ['a missing items list', {}],
    ['a zero quantity', { items: [{ type: 'book', slug: 'or-haalacha-1', quantity: 0 }] }],
    ['a fractional quantity', { items: [{ type: 'book', slug: 'or-haalacha-1', quantity: 1.5 }] }],
    ['a huge quantity', { items: [{ type: 'book', slug: 'or-haalacha-1', quantity: 1000 }] }],
    ['an unknown type', { items: [{ type: 'pen', slug: 'or-haalacha-1', quantity: 1 }] }],
    ['a malformed slug', { items: [{ type: 'book', slug: 'Or Haalacha', quantity: 1 }] }],
    [
      'too many lines',
      { items: Array.from({ length: 51 }, () => ({ type: 'book', slug: 'x', quantity: 1 })) },
    ],
  ])('rejects %s', async (_, body) => {
    const res = await request(app).post('/cart/quote').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects operator injection in the slug', async () => {
    const res = await quote([{ type: 'book', slug: { $ne: null }, quantity: 1 }]);
    expect(res.status).toBe(400);
  });
});
