import { describe, expect, it } from 'vitest';
import { priceCart } from '../../src/services/cartPricing.js';

const book = (slug, stock, priceAgorot = 6500) => ({ slug, title: slug, priceAgorot, stock });
const books = [book('vol-1', 10), book('vol-2', 3), book('vol-3', 0), book('vol-4', 10, 7000)];
const bundles = [
  { slug: 'full-set', title: 'Full set', priceAgorot: 22000, bookSlugs: ['vol-1', 'vol-2'] },
];

const price = (lines) => priceCart({ lines, books, bundles });

describe('priceCart', () => {
  it('prices available books from the database', () => {
    const result = price([
      { type: 'book', slug: 'vol-1', quantity: 2 },
      { type: 'book', slug: 'vol-4', quantity: 1 },
    ]);

    expect(result.items).toEqual([
      {
        type: 'book',
        slug: 'vol-1',
        title: 'vol-1',
        unitPriceAgorot: 6500,
        requestedQuantity: 2,
        quantity: 2,
        lineTotalAgorot: 13000,
        status: 'ok',
      },
      expect.objectContaining({ slug: 'vol-4', lineTotalAgorot: 7000, status: 'ok' }),
    ]);
    expect(result.subtotalAgorot).toBe(20000);
    expect(result.allAvailable).toBe(true);
  });

  it('limits a line to the stock', () => {
    const [item] = price([{ type: 'book', slug: 'vol-2', quantity: 5 }]).items;
    expect(item).toMatchObject({ requestedQuantity: 5, quantity: 3, status: 'limited' });
    expect(item.lineTotalAgorot).toBe(3 * 6500);
  });

  it('marks a book without stock as out of stock', () => {
    const result = price([{ type: 'book', slug: 'vol-3', quantity: 1 }]);
    expect(result.items[0]).toMatchObject({
      quantity: 0,
      lineTotalAgorot: 0,
      status: 'out_of_stock',
    });
    expect(result.allAvailable).toBe(false);
  });

  it('marks unknown or hidden products as unavailable', () => {
    const result = price([
      { type: 'book', slug: 'gone', quantity: 1 },
      { type: 'bundle', slug: 'old-set', quantity: 1 },
    ]);
    expect(result.items.map((i) => i.status)).toEqual(['unavailable', 'unavailable']);
    expect(result.items[0]).toMatchObject({
      title: null,
      unitPriceAgorot: null,
      requestedQuantity: 1,
    });
    expect(result.subtotalAgorot).toBe(0);
  });

  it('merges repeated lines for the same product', () => {
    const result = price([
      { type: 'book', slug: 'vol-1', quantity: 1 },
      { type: 'book', slug: 'vol-1', quantity: 2 },
    ]);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ requestedQuantity: 3, quantity: 3 });
  });

  it('prices a bundle by its own price', () => {
    const result = price([{ type: 'bundle', slug: 'full-set', quantity: 1 }]);
    expect(result.items[0]).toMatchObject({ unitPriceAgorot: 22000, status: 'ok' });
    expect(result.subtotalAgorot).toBe(22000);
  });

  it('limits bundles to the scarcest included book', () => {
    const [item] = price([{ type: 'bundle', slug: 'full-set', quantity: 5 }]).items;
    expect(item).toMatchObject({ quantity: 3, status: 'limited' });
  });

  it('shares stock between bundles and single books, bundles first', () => {
    const result = price([
      { type: 'book', slug: 'vol-2', quantity: 2 },
      { type: 'bundle', slug: 'full-set', quantity: 2 },
    ]);
    const [single, bundle] = result.items;
    expect(bundle).toMatchObject({ quantity: 2, status: 'ok' });
    expect(single).toMatchObject({ requestedQuantity: 2, quantity: 1, status: 'limited' });
  });

  it('treats a bundle with a missing book as out of stock', () => {
    const result = priceCart({
      lines: [{ type: 'bundle', slug: 'full-set', quantity: 1 }],
      books: [book('vol-1', 10)],
      bundles,
    });
    expect(result.items[0]).toMatchObject({ quantity: 0, status: 'out_of_stock' });
  });

  it('returns an empty quote for an empty cart', () => {
    expect(price([])).toEqual({ items: [], subtotalAgorot: 0, allAvailable: true });
  });
});
