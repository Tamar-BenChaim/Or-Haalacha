import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';

import { CartLine, CartQuote, QuotedLine } from '../models/cart';
import { UiStore } from '../ui/ui-store';
import { CART_QUOTE_SOURCE } from './cart-quote-source';
import { CART_STORAGE_KEY, CartStore, MAX_LINES, MAX_QUANTITY, parseCartLines } from './cart-store';

const book = (slug: string) => ({ type: 'book' as const, slug });

/** A quote where every line is fine and costs 10 ₪ per copy. */
function okQuote(lines: CartLine[]): CartQuote {
  const items = lines.map((line): QuotedLine => ({
    ...line,
    requestedQuantity: line.quantity,
    title: `ספר ${line.ref.slug}`,
    unitPriceAgorot: 1000,
    lineTotalAgorot: 1000 * line.quantity,
    status: 'ok',
  }));
  return {
    items,
    subtotalAgorot: items.reduce((sum, item) => sum + item.lineTotalAgorot, 0),
    allAvailable: true,
  };
}

function setup(
  quote: (lines: CartLine[]) => Observable<CartQuote> = (lines) => of(okQuote(lines)),
) {
  const source = { quote: vi.fn(quote) };
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: CART_QUOTE_SOURCE, useValue: source }],
  });
  return { source, store: TestBed.inject(CartStore), ui: TestBed.inject(UiStore) };
}

describe('parseCartLines', () => {
  it('returns nothing for missing, broken or wrongly shaped data', () => {
    expect(parseCartLines(null)).toEqual([]);
    expect(parseCartLines('')).toEqual([]);
    expect(parseCartLines('{not json')).toEqual([]);
    expect(parseCartLines('{"a":1}')).toEqual([]);
  });

  it('keeps valid lines and drops invalid ones', () => {
    const raw = JSON.stringify([
      { ref: book('a'), quantity: 2 },
      { ref: { type: 'hack', slug: 'b' }, quantity: 1 },
      { ref: book(''), quantity: 1 },
      { ref: book('c'), quantity: 0 },
      { ref: book('d'), quantity: 1.5 },
      { ref: book('e'), quantity: '3' },
      { quantity: 1 },
      null,
      'text',
    ]);
    expect(parseCartLines(raw)).toEqual([{ ref: book('a'), quantity: 2 }]);
  });

  it('removes duplicates and caps quantity and number of lines', () => {
    expect(
      parseCartLines(
        JSON.stringify([
          { ref: book('a'), quantity: 1 },
          { ref: book('a'), quantity: 5 },
          { ref: book('b'), quantity: 500 },
        ]),
      ),
    ).toEqual([
      { ref: book('a'), quantity: 1 },
      { ref: book('b'), quantity: MAX_QUANTITY },
    ]);

    const many = Array.from({ length: MAX_LINES + 10 }, (_, i) => ({
      ref: book(`b${i}`),
      quantity: 1,
    }));
    expect(parseCartLines(JSON.stringify(many))).toHaveLength(MAX_LINES);
  });
});

describe('CartStore', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('starts empty', () => {
    const { store } = setup();
    expect(store.isEmpty()).toBe(true);
    expect(store.count()).toBe(0);
  });

  it('adds new items, adds up quantities of the same item, and counts all copies', () => {
    const { store } = setup();
    store.addItem(book('a'));
    store.addItem(book('a'), 2);
    store.addItem(book('b'));
    expect(store.lines()).toEqual([
      { ref: book('a'), quantity: 3 },
      { ref: book('b'), quantity: 1 },
    ]);
    expect(store.count()).toBe(4);
  });

  it('never goes above the maximum quantity', () => {
    const { store } = setup();
    store.addItem(book('a'), 98);
    store.addItem(book('a'), 5);
    expect(store.lines()[0].quantity).toBe(MAX_QUANTITY);
  });

  it('does not exceed the maximum number of different items', () => {
    const { store } = setup();
    for (let i = 0; i < MAX_LINES + 3; i++) {
      store.addItem(book(`b${i}`));
    }
    expect(store.lines()).toHaveLength(MAX_LINES);
  });

  it('opens the side cart and animates the button when something is added', () => {
    const { store, ui } = setup();
    store.addItem(book('a'));
    expect(ui.drawerOpen()).toBe(true);
    expect(ui.bumping()).toBe(true);
  });

  it('ignores invalid additions', () => {
    const { store, ui } = setup();
    store.addItem(book(''));
    store.addItem(book('a'), 0);
    store.addItem(book('a'), 1.5);
    store.addItem(book('x'.repeat(101)));
    expect(store.isEmpty()).toBe(true);
    expect(ui.drawerOpen()).toBe(false);
  });

  it('sets the quantity, and removes the item at zero', () => {
    const { store } = setup();
    store.addItem(book('a'));
    store.setQuantity(book('a'), 5);
    expect(store.lines()[0].quantity).toBe(5);
    store.setQuantity(book('a'), 0);
    expect(store.isEmpty()).toBe(true);
  });

  it('removes one item and clears everything', () => {
    const { store } = setup();
    store.addItem(book('a'));
    store.addItem(book('b'));
    store.remove(book('a'));
    expect(store.lines()).toEqual([{ ref: book('b'), quantity: 1 }]);
    store.clear();
    expect(store.isEmpty()).toBe(true);
  });

  describe('saving in the browser', () => {
    it('saves only the slug and quantity, never a price', () => {
      const { store } = setup();
      store.addItem(book('a'), 2);
      expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY)!)).toEqual([
        { ref: book('a'), quantity: 2 },
      ]);
    });

    it('removes the saved cart when it becomes empty', () => {
      const { store } = setup();
      store.addItem(book('a'));
      store.clear();
      expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
    });

    it('restores a saved cart', () => {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([{ ref: book('a'), quantity: 4 }]));
      const { store } = setup();
      expect(store.count()).toBe(4);
    });

    it('survives damaged saved data', () => {
      localStorage.setItem(CART_STORAGE_KEY, '{broken');
      const { store } = setup();
      expect(store.isEmpty()).toBe(true);
    });

    it('keeps working when the browser blocks writing', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      const { store } = setup();
      expect(() => store.addItem(book('a'))).not.toThrow();
      expect(store.count()).toBe(1);
    });

    it('follows changes made in another tab', () => {
      const { store } = setup();
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([{ ref: book('z'), quantity: 2 }]));
      window.dispatchEvent(new StorageEvent('storage', { key: CART_STORAGE_KEY }));
      expect(store.lines()).toEqual([{ ref: book('z'), quantity: 2 }]);
    });
  });

  describe('prices from the server', () => {
    it('asks the server with only slugs and quantities', () => {
      const { store, source } = setup();
      store.addItem(book('a'), 2);
      expect(source.quote).toHaveBeenLastCalledWith([{ ref: book('a'), quantity: 2 }]);
    });

    it('shows titles, prices and the subtotal from the answer', () => {
      const { store } = setup();
      store.addItem(book('a'), 2);
      expect(store.quoteState()).toBe('ready');
      expect(store.items()[0]).toMatchObject({
        title: 'ספר a',
        unitPriceAgorot: 1000,
        lineTotalAgorot: 2000,
        status: 'ok',
      });
      expect(store.subtotalAgorot()).toBe(2000);
      expect(store.canCheckout()).toBe(true);
    });

    it('shows a line as pending until the server answered', () => {
      const pending = new Subject<CartQuote>();
      const { store } = setup(() => pending);
      store.addItem(book('a'));
      expect(store.quoteState()).toBe('loading');
      expect(store.items()[0].status).toBe('pending');
      expect(store.subtotalAgorot()).toBeNull();
      expect(store.canCheckout()).toBe(false);
    });

    it('hides a line total that was calculated for another quantity', () => {
      const first = new Subject<CartQuote>();
      const second = new Subject<CartQuote>();
      const answers = [first, second];
      const { store } = setup(() => answers.shift()!);

      store.addItem(book('a'));
      first.next(okQuote([{ ref: book('a'), quantity: 1 }]));
      expect(store.items()[0].lineTotalAgorot).toBe(1000);

      store.setQuantity(book('a'), 2);
      expect(store.items()[0].lineTotalAgorot).toBeNull();
      second.next(okQuote([{ ref: book('a'), quantity: 2 }]));
      expect(store.items()[0].lineTotalAgorot).toBe(2000);
    });

    it('ignores an old answer that arrives after a newer request', () => {
      const first = new Subject<CartQuote>();
      const second = new Subject<CartQuote>();
      const answers = [first, second];
      const { store } = setup(() => answers.shift()!);

      store.addItem(book('a'));
      store.setQuantity(book('a'), 2);
      first.next(okQuote([{ ref: book('a'), quantity: 1 }]));
      expect(store.quoteState()).toBe('loading');
      second.next(okQuote([{ ref: book('a'), quantity: 2 }]));
      expect(store.subtotalAgorot()).toBe(2000);
    });

    it('lowers a quantity the server cannot supply, and says so', () => {
      const { store } = setup((lines) => {
        const quote = okQuote(lines);
        quote.items[0] = {
          ...quote.items[0],
          status: 'limited',
          quantity: 2,
          requestedQuantity: 5,
        };
        return of(quote);
      });
      store.addItem(book('a'), 5);
      expect(store.lines()[0].quantity).toBe(2);
      expect(store.notices()[0]).toContain('במלאי רק 2');
    });

    it('removes an item that is no longer available, and says so', () => {
      const { store } = setup((lines) => {
        const quote = okQuote(lines);
        quote.items[0] = {
          ...quote.items[0],
          status: 'unavailable',
          title: null,
          unitPriceAgorot: null,
        };
        return of(quote);
      });
      store.addItem(book('a'));
      expect(store.isEmpty()).toBe(true);
      expect(store.notices()).toHaveLength(1);
    });

    it('blocks checkout while an item is out of stock', () => {
      const { store } = setup((lines) => {
        const quote = okQuote(lines);
        quote.items[0] = { ...quote.items[0], status: 'out_of_stock', lineTotalAgorot: 0 };
        quote.allAvailable = false;
        return of(quote);
      });
      store.addItem(book('a'));
      expect(store.items()[0].status).toBe('out_of_stock');
      expect(store.canCheckout()).toBe(false);
    });

    it('keeps the cart and reports an error when the server fails', () => {
      const { store } = setup(() => throwError(() => new Error('down')));
      store.addItem(book('a'));
      expect(store.quoteState()).toBe('error');
      expect(store.count()).toBe(1);
      expect(store.canCheckout()).toBe(false);
    });

    it('does not ask the server for an empty cart', () => {
      const { store, source } = setup();
      store.revalidate();
      expect(source.quote).not.toHaveBeenCalled();
      expect(store.quoteState()).toBe('idle');
    });
  });
});
