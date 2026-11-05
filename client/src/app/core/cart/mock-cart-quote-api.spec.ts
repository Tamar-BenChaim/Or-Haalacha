import { TestBed } from '@angular/core/testing';

import { MOCK_BOOKS } from '../catalog/mock-books';
import { CartQuote } from '../models/cart';
import { MockCartQuoteApi } from './mock-cart-quote-api';

describe('MockCartQuoteApi', () => {
  afterEach(() => vi.useRealTimers());

  function quote(...lines: { slug: string; quantity: number; type?: 'book' | 'bundle' }[]) {
    vi.useFakeTimers();
    let result: CartQuote | undefined;
    TestBed.inject(MockCartQuoteApi)
      .quote(
        lines.map((l) => ({ ref: { type: l.type ?? 'book', slug: l.slug }, quantity: l.quantity })),
      )
      .subscribe((value) => (result = value));
    vi.advanceTimersByTime(300);
    return result!;
  }

  it('prices available books and totals them in agorot', () => {
    const first = MOCK_BOOKS[0];
    const result = quote({ slug: first.slug, quantity: 3 });
    expect(result.items[0]).toMatchObject({
      status: 'ok',
      title: first.title,
      unitPriceAgorot: first.priceAgorot,
      lineTotalAgorot: first.priceAgorot * 3,
    });
    expect(result.subtotalAgorot).toBe(first.priceAgorot * 3);
    expect(result.allAvailable).toBe(true);
  });

  it('marks the sold out book and does not charge for it', () => {
    const soldOut = MOCK_BOOKS.find((b) => !b.inStock)!;
    const result = quote({ slug: soldOut.slug, quantity: 1 });
    expect(result.items[0].status).toBe('out_of_stock');
    expect(result.subtotalAgorot).toBe(0);
    expect(result.allAvailable).toBe(false);
  });

  it('marks unknown books and sets as unavailable', () => {
    const result = quote(
      { slug: 'nope', quantity: 1 },
      { slug: 'full-set', quantity: 1, type: 'bundle' },
    );
    expect(result.items.map((i) => i.status)).toEqual(['unavailable', 'unavailable']);
  });
});
