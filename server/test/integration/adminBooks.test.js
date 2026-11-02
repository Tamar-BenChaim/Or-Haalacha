import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createRepositories, ensureIndexes } from '../../src/data/index.js';
import { seedSampleData } from '../../src/data/seed.js';
import { ADMIN_EMAIL, buildApp, fakeVerifyAccessToken, useTestDatabase } from '../helpers.js';

const getDatabase = useTestDatabase();
let app;

beforeAll(async () => {
  const repositories = createRepositories(getDatabase().db);
  await ensureIndexes(repositories);
  app = buildApp({ repositories, verifyAccessToken: fakeVerifyAccessToken });
});

beforeEach(async () => {
  const { db } = getDatabase();
  await db.collection('books').deleteMany({});
  await db.collection('bundles').deleteMany({});
  await db.collection('audit_logs').deleteMany({});
  await seedSampleData(createRepositories(db));
});

const as = (token) => ({
  get: (path) => request(app).get(path).set('Cf-Access-Jwt-Assertion', token),
  post: (path, body) => request(app).post(path).set('Cf-Access-Jwt-Assertion', token).send(body),
  patch: (path, body) => request(app).patch(path).set('Cf-Access-Jwt-Assertion', token).send(body),
  put: (path, body) => request(app).put(path).set('Cf-Access-Jwt-Assertion', token).send(body),
});
const admin = as('admin-token');

const auditEntries = () => getDatabase().db.collection('audit_logs').find({}).toArray();
const bookId = async (slug) =>
  (await getDatabase().db.collection('books').findOne({ slug }))._id.toString();

const newBook = {
  slug: 'or-haalacha-6',
  title: "אור ההלכה – כרך ו'",
  volume: 6,
  priceAgorot: 7000,
  stock: 12,
};

describe('admin access', () => {
  it('answers 401 without a Cloudflare Access token', async () => {
    const res = await request(app).get('/admin/books');
    expect(res.status).toBe(401);
  });

  it('answers 403 for someone who is not an admin', async () => {
    const res = await as('stranger-token').get('/admin/books');
    expect(res.status).toBe(403);
  });

  it('is never cached', async () => {
    const res = await admin.get('/admin/books');
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('requires JSON for changes', async () => {
    const res = await request(app)
      .post('/admin/books')
      .set('Cf-Access-Jwt-Assertion', 'admin-token')
      .set('Content-Type', 'text/plain')
      .send('slug=x');
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });
});

describe('admin CORS', () => {
  it('allows the admin origin with credentials on admin routes', async () => {
    const res = await admin.get('/admin/books').set('Origin', 'http://localhost:5174');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5174');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not allow the store origin on admin routes', async () => {
    const res = await admin.get('/admin/books').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('keeps store routes for the store origin, without credentials', async () => {
    const res = await request(app).get('/books').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBeUndefined();
  });
});

describe('GET /admin/books', () => {
  it('lists every book, including hidden ones, with stock details', async () => {
    const res = await admin.get('/admin/books');

    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(5);
    const hidden = res.body.books.find((b) => b.slug === 'or-haalacha-5');
    expect(hidden).toMatchObject({
      hidden: true,
      stock: 20,
      lowStockThreshold: 5,
      lowStock: false,
    });
    const soldOut = res.body.books.find((b) => b.slug === 'or-haalacha-4');
    expect(soldOut.lowStock).toBe(true);
  });

  it('gets one book by id', async () => {
    const res = await admin.get(`/admin/books/${await bookId('or-haalacha-2')}`);
    expect(res.status).toBe(200);
    expect(res.body.book.slug).toBe('or-haalacha-2');
  });

  it('answers 404 for an unknown id and 400 for a malformed one', async () => {
    expect((await admin.get('/admin/books/65a000000000000000000000')).status).toBe(404);
    expect((await admin.get('/admin/books/not-an-id')).status).toBe(400);
  });
});

describe('POST /admin/books', () => {
  it('creates a book at the end of the list and audits it', async () => {
    const res = await admin.post('/admin/books', newBook);

    expect(res.status).toBe(201);
    expect(res.body.book).toMatchObject({
      ...newBook,
      shortDescription: '',
      lowStockThreshold: 0,
      hidden: false,
      sortOrder: 6,
    });

    const publicList = await request(app).get('/books');
    expect(publicList.body.books.at(-1).slug).toBe('or-haalacha-6');

    const [entry] = await auditEntries();
    expect(entry).toMatchObject({
      actor: ADMIN_EMAIL,
      action: 'book.create',
      entityId: res.body.book.id,
      changes: { priceAgorot: { from: null, to: 7000 } },
    });
  });

  it('refuses a taken address', async () => {
    const res = await admin.post('/admin/books', { ...newBook, slug: 'or-haalacha-1' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SLUG_TAKEN');
  });

  it.each([
    ['a missing title', { title: undefined }],
    ['a zero price', { priceAgorot: 0 }],
    ['a price in shekels with decimals', { priceAgorot: 65.5 }],
    ['negative stock', { stock: -1 }],
    ['a field that may not be set', { sortOrder: 1 }],
  ])('rejects %s', async (_, overrides) => {
    const res = await admin.post('/admin/books', { ...newBook, ...overrides });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('PATCH /admin/books/:id', () => {
  it('updates fields and audits only what changed', async () => {
    const id = await bookId('or-haalacha-1');
    const res = await admin.patch(`/admin/books/${id}`, {
      priceAgorot: 6900,
      title: "אור ההלכה – כרך א'",
    });

    expect(res.status).toBe(200);
    expect(res.body.book.priceAgorot).toBe(6900);

    const [entry] = await auditEntries();
    expect(entry).toMatchObject({
      action: 'book.update',
      entityId: id,
      changes: { priceAgorot: { from: 6500, to: 6900 } },
    });
    expect(entry.changes).not.toHaveProperty('title');
  });

  it('writes no audit entry when nothing changes', async () => {
    const id = await bookId('or-haalacha-1');
    await admin.patch(`/admin/books/${id}`, { priceAgorot: 6500 });
    expect(await auditEntries()).toHaveLength(0);
  });

  it('hides a book from the store', async () => {
    await admin.patch(`/admin/books/${await bookId('or-haalacha-1')}`, { hidden: true });
    const res = await request(app).get('/books/or-haalacha-1');
    expect(res.status).toBe(404);
  });

  it('does not allow changing the address', async () => {
    const res = await admin.patch(`/admin/books/${await bookId('or-haalacha-1')}`, { slug: 'new' });
    expect(res.status).toBe(400);
  });

  it('rejects an empty update', async () => {
    const res = await admin.patch(`/admin/books/${await bookId('or-haalacha-1')}`, {});
    expect(res.status).toBe(400);
  });

  it('answers 404 for an unknown book', async () => {
    const res = await admin.patch('/admin/books/65a000000000000000000000', { stock: 1 });
    expect(res.status).toBe(404);
  });
});

describe('PUT /admin/books/order', () => {
  it('changes the display order in the store and audits it', async () => {
    const ids = await Promise.all([5, 4, 3, 2, 1].map((n) => bookId(`or-haalacha-${n}`)));
    const res = await admin.put('/admin/books/order', { ids });

    expect(res.status).toBe(200);
    expect(res.body.books.map((b) => b.slug)[0]).toBe('or-haalacha-5');

    const publicList = await request(app).get('/books');
    expect(publicList.body.books.map((b) => b.slug)).toEqual([
      'or-haalacha-4',
      'or-haalacha-3',
      'or-haalacha-2',
      'or-haalacha-1',
    ]);
    expect((await auditEntries())[0].action).toBe('book.reorder');
  });

  it('rejects an order that leaves out a book', async () => {
    const ids = await Promise.all([1, 2, 3, 4].map((n) => bookId(`or-haalacha-${n}`)));
    const res = await admin.put('/admin/books/order', { ids });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_ORDER');
  });

  it('rejects an order that repeats a book', async () => {
    const one = await bookId('or-haalacha-1');
    const others = await Promise.all([2, 3, 4].map((n) => bookId(`or-haalacha-${n}`)));
    const res = await admin.put('/admin/books/order', { ids: [one, one, ...others] });
    expect(res.status).toBe(400);
  });
});

describe('admin bundles', () => {
  const bundleId = async () =>
    (await getDatabase().db.collection('bundles').findOne({ slug: 'full-set' }))._id.toString();

  it('lists bundles', async () => {
    const res = await admin.get('/admin/bundles');
    expect(res.status).toBe(200);
    expect(res.body.bundles[0]).toMatchObject({ slug: 'full-set', priceAgorot: 22000 });
  });

  it('updates the price and books, and the store reflects it', async () => {
    const id = await bundleId();
    const res = await admin.patch(`/admin/bundles/${id}`, {
      priceAgorot: 18000,
      bookSlugs: ['or-haalacha-1', 'or-haalacha-2', 'or-haalacha-3'],
    });

    expect(res.status).toBe(200);
    const store = await request(app).get('/bundles');
    expect(store.body.bundles[0]).toMatchObject({ priceAgorot: 18000, inStock: true });
    expect((await auditEntries())[0]).toMatchObject({ action: 'bundle.update', entityId: id });
  });

  it('rejects books that do not exist', async () => {
    const res = await admin.patch(`/admin/bundles/${await bundleId()}`, {
      bookSlugs: ['or-haalacha-1', 'no-such-book'],
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('UNKNOWN_BOOKS');
  });

  it('rejects repeated books', async () => {
    const res = await admin.patch(`/admin/bundles/${await bundleId()}`, {
      bookSlugs: ['or-haalacha-1', 'or-haalacha-1'],
    });
    expect(res.status).toBe(400);
  });
});
