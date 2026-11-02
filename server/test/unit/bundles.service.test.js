import { ObjectId } from 'mongodb';
import { describe, expect, it } from 'vitest';
import { createBundlesService } from '../../src/services/bundles.service.js';

const bundle = {
  _id: new ObjectId('65a000000000000000000009'),
  slug: 'full-set',
  title: 'Full set',
  description: 'All volumes',
  priceAgorot: 12000,
  bookSlugs: ['vol-1', 'vol-2'],
};

function serviceWith(books) {
  return createBundlesService({
    bundles: { findVisible: async () => [bundle] },
    books: { findVisibleBySlugs: async () => books },
  });
}

describe('bundles service', () => {
  it('adds the separate price of the included books and stock status', async () => {
    const [result] = await serviceWith([
      { slug: 'vol-1', title: 'Vol 1', volume: 1, priceAgorot: 6500, stock: 2 },
      { slug: 'vol-2', title: 'Vol 2', volume: 2, priceAgorot: 7000, stock: 1 },
    ]).listVisible();

    expect(result).toEqual({
      id: '65a000000000000000000009',
      slug: 'full-set',
      title: 'Full set',
      description: 'All volumes',
      priceAgorot: 12000,
      separatePriceAgorot: 13500,
      inStock: true,
      books: [
        { slug: 'vol-1', title: 'Vol 1', volume: 1 },
        { slug: 'vol-2', title: 'Vol 2', volume: 2 },
      ],
    });
  });

  it('is out of stock and has no separate price when a book is hidden', async () => {
    const [result] = await serviceWith([
      { slug: 'vol-1', title: 'Vol 1', volume: 1, priceAgorot: 6500, stock: 2 },
    ]).listVisible();

    expect(result).toMatchObject({ inStock: false, separatePriceAgorot: null });
    expect(result.books).toHaveLength(1);
  });
});
