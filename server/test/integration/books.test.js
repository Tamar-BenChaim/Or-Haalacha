import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createRepositories, ensureIndexes } from '../../src/data/index.js';
import { sampleBooks } from '../../src/data/sampleBooks.js';
import { seedSampleBooks } from '../../src/data/seed.js';
import { buildApp, useTestDatabase } from '../helpers.js';

const getDatabase = useTestDatabase();
let app;
let repositories;

beforeAll(async () => {
  repositories = createRepositories(getDatabase().db);
  await ensureIndexes(repositories);
  await seedSampleBooks(repositories.books);
  app = buildApp({ repositories });
});

describe('GET /books', () => {
  it('lists visible books in display order without internal fields', async () => {
    const res = await request(app).get('/books');

    expect(res.status).toBe(200);
    expect(res.body.books.map((b) => b.slug)).toEqual([
      'or-haalacha-1',
      'or-haalacha-2',
      'or-haalacha-3',
      'or-haalacha-4',
    ]);
    expect(res.body.books[0]).toMatchObject({ priceAgorot: 6500, inStock: true });
    expect(res.body.books[3].inStock).toBe(false);
    expect(res.body.books[0]).not.toHaveProperty('stock');
    expect(res.body.books[0]).not.toHaveProperty('description');
  });
});

describe('GET /books/:slug', () => {
  it('returns a single book with its full description', async () => {
    const res = await request(app).get('/books/or-haalacha-1');
    expect(res.status).toBe(200);
    expect(res.body.book).toMatchObject({
      slug: 'or-haalacha-1',
      description: sampleBooks[0].description,
    });
  });

  it.each(['or-haalacha-5', 'no-such-book'])('answers 404 for %s', async (slug) => {
    const res = await request(app).get(`/books/${slug}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('BOOK_NOT_FOUND');
  });

  it.each(['Bad_Slug', 'a--b', '-start'])('rejects the malformed slug %s', async (slug) => {
    const res = await request(app).get(`/books/${slug}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('books data', () => {
  it('seeds idempotently and keeps the original creation time', async () => {
    const collection = getDatabase().db.collection('books');
    const before = await collection.findOne({ slug: 'or-haalacha-1' });

    await seedSampleBooks(repositories.books);

    expect(await collection.countDocuments()).toBe(sampleBooks.length);
    const after = await collection.findOne({ slug: 'or-haalacha-1' });
    expect(after.createdAt).toEqual(before.createdAt);
  });

  it('enforces unique slugs', async () => {
    const collection = getDatabase().db.collection('books');
    await expect(collection.insertOne({ slug: 'or-haalacha-1' })).rejects.toThrow(/duplicate/);
  });
});
