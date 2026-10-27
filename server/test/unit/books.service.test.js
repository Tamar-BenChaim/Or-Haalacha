import { ObjectId } from 'mongodb';
import { describe, expect, it } from 'vitest';
import { createBooksService } from '../../src/services/books.service.js';

const document = {
  _id: new ObjectId('65a000000000000000000001'),
  slug: 'or-haalacha-1',
  title: "אור ההלכה – כרך א'",
  volume: 1,
  shortDescription: 'קצר',
  description: 'מלא',
  priceAgorot: 6500,
  stock: 3,
  lowStockThreshold: 5,
  coverImage: null,
  hidden: false,
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function serviceWith(documents) {
  return createBooksService({
    books: {
      findVisible: async () => documents,
      findVisibleBySlug: async (slug) => documents.find((d) => d.slug === slug) ?? null,
    },
  });
}

describe('books service', () => {
  it('lists books with public fields only', async () => {
    const [book] = await serviceWith([document]).listVisible();
    expect(book).toEqual({
      id: '65a000000000000000000001',
      slug: 'or-haalacha-1',
      title: "אור ההלכה – כרך א'",
      volume: 1,
      shortDescription: 'קצר',
      priceAgorot: 6500,
      inStock: true,
      coverImage: null,
    });
  });

  it('reports a book with no stock as out of stock', async () => {
    const [book] = await serviceWith([{ ...document, stock: 0 }]).listVisible();
    expect(book.inStock).toBe(false);
  });

  it('adds the full description to a single book', async () => {
    const book = await serviceWith([document]).getVisibleBySlug('or-haalacha-1');
    expect(book.description).toBe('מלא');
    expect(book).not.toHaveProperty('stock');
    expect(book).not.toHaveProperty('lowStockThreshold');
    expect(book).not.toHaveProperty('hidden');
  });

  it('returns null for an unknown book', async () => {
    expect(await serviceWith([document]).getVisibleBySlug('missing')).toBeNull();
  });
});
