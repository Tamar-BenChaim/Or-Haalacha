import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CART_QUOTE_SOURCE } from '../../../core/cart/cart-quote-source';
import { CartStore } from '../../../core/cart/cart-store';
import { BOOKS_SOURCE } from '../../../core/catalog/books-source';
import { CartLine, CartQuote, QuotedLine } from '../../../core/models/cart';
import { sampleBook } from '../../../core/testing/sample-books';
import { Cart } from './cart';

function quoteOf(lines: CartLine[]): CartQuote {
  const items = lines.map((line): QuotedLine => ({
    ...line,
    requestedQuantity: line.quantity,
    title: `ספר ${line.ref.slug}`,
    unitPriceAgorot: 2000,
    lineTotalAgorot: 2000 * line.quantity,
    status: 'ok',
  }));
  return {
    items,
    subtotalAgorot: items.reduce((s, i) => s + i.lineTotalAgorot, 0),
    allAvailable: true,
  };
}

function setup(prepare?: (cart: CartStore) => void, quote = quoteOf) {
  localStorage.clear();
  const source = { quote: vi.fn((lines: CartLine[]) => of(quote(lines))) };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: CART_QUOTE_SOURCE, useValue: source },
      { provide: BOOKS_SOURCE, useValue: { list: () => of([{ ...sampleBook, slug: 'a' }]) } },
    ],
  });
  const cart = TestBed.inject(CartStore);
  prepare?.(cart);
  const fixture = TestBed.createComponent(Cart);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, cart, source };
}

describe('Cart page', () => {
  it('has a single h1', () => {
    const { el } = setup();
    expect(el.querySelectorAll('h1')).toHaveLength(1);
    expect(el.querySelector('h1')!.textContent).toContain('עגלת הקניות');
  });

  describe('empty cart', () => {
    it('shows the message and a link back to the books', () => {
      const { el } = setup();
      expect(el.querySelector('.empty-title')!.textContent).toContain('העגלה ריקה');
      expect(el.querySelector('.empty .muted')!.textContent).toContain('עדיין לא נבחרו ספרים');
      expect(el.querySelector('.empty a')!.getAttribute('href')).toBe('/#books');
      expect(el.querySelector('.summary')).toBeNull();
    });
  });

  describe('with items', () => {
    const two = (cart: CartStore) => {
      cart.addItem({ type: 'book', slug: 'a' }, 2);
      cart.addItem({ type: 'book', slug: 'b' });
    };

    it('lists the lines with a cover for each', () => {
      const { el } = setup(two);
      expect(el.querySelectorAll('oh-cart-line')).toHaveLength(2);
      expect(el.querySelectorAll('oh-cart-line a.mini')).toHaveLength(2);
    });

    it('shows the standing note about price changes', () => {
      const { el } = setup(two);
      expect(el.querySelector('.info')!.textContent).toContain(
        'אם מחיר השתנה או שספר אזל מאז שהוספתם אותו, תופיע כאן הודעה.',
      );
    });

    it('replaces the note with the messages when the server changed something', () => {
      const { el } = setup(
        (cart) => cart.addItem({ type: 'book', slug: 'a' }, 5),
        (lines) => {
          const quote = quoteOf(lines);
          quote.items[0] = {
            ...quote.items[0],
            status: 'limited',
            quantity: 2,
            requestedQuantity: 5,
          };
          return quote;
        },
      );
      const info = el.querySelector('.info')!.textContent!;
      expect(info).toContain('במלאי רק 2');
      expect(info).not.toContain('תופיע כאן הודעה');
    });

    it('has a framed summary with the subtotal from the server and the shipping note', () => {
      const { el } = setup(two);
      const summary = el.querySelector('aside.summary')!;
      expect(summary.querySelector('h2')!.textContent).toContain('סיכום');
      const rows = Array.from(summary.querySelectorAll('.row')).map((r) => r.textContent);
      expect(rows[0]).toContain('סכום ביניים');
      expect(rows[0]).toContain('60');
      expect(rows[1]).toContain('משלוח');
      expect(rows[1]).toContain('יחושב בשלב הבא');
    });

    it('has the checkout button and the "continue shopping" link', () => {
      const { el } = setup(two);
      const checkout = el.querySelector('.summary a.checkout')!;
      expect(checkout.textContent).toContain('להמשך לתשלום');
      expect(checkout.getAttribute('href')).toBe('/checkout');
      const more = el.querySelector('.summary a.arrow')!;
      expect(more.textContent).toContain('להמשך קנייה');
      expect(more.getAttribute('href')).toBe('/#books');
    });

    it('blocks checkout while an item is sold out', () => {
      const { el } = setup(
        (cart) => cart.addItem({ type: 'book', slug: 'a' }),
        (lines) => {
          const quote = quoteOf(lines);
          quote.items[0] = { ...quote.items[0], status: 'out_of_stock', lineTotalAgorot: 0 };
          quote.allAvailable = false;
          return quote;
        },
      );
      const checkout = el.querySelector('a.checkout')!;
      expect(checkout.getAttribute('aria-disabled')).toBe('true');
      expect(checkout.getAttribute('href')).toBeNull();
    });

    it('asks the server for fresh prices when the page opens', () => {
      const { source } = setup(two);
      expect(source.quote.mock.calls.length).toBeGreaterThan(0);
    });

    it('updates and removes through the lines', () => {
      const { fixture, el, cart } = setup((c) => c.addItem({ type: 'book', slug: 'a' }));
      el.querySelector<HTMLButtonElement>('button[aria-label="הגדלת כמות"]')!.click();
      fixture.detectChanges();
      expect(cart.count()).toBe(2);
      el.querySelector<HTMLButtonElement>('button.remove')!.click();
      fixture.detectChanges();
      expect(cart.isEmpty()).toBe(true);
      expect(el.querySelector('.empty')).toBeTruthy();
    });
  });

  describe('coupon field (shown in development for design review)', () => {
    it('has a labelled field and an apply button', () => {
      const { el } = setup((cart) => cart.addItem({ type: 'book', slug: 'a' }));
      const input = el.querySelector<HTMLInputElement>('input#coupon')!;
      expect(el.querySelector(`label[for="${input.id}"]`)!.textContent).toContain('קוד קופון');
      expect(el.querySelector('.coupon-row button')!.textContent).toContain('החלה');
    });

    it('says honestly that coupons are not supported yet', () => {
      const { fixture, el } = setup((cart) => cart.addItem({ type: 'book', slug: 'a' }));
      el.querySelector<HTMLButtonElement>('.coupon-row button')!.click();
      fixture.detectChanges();
      expect(el.querySelector('[role="status"]')!.textContent).toContain('עדיין לא נתמכים');
    });
  });
});
