import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CART_QUOTE_SOURCE } from '../../../core/cart/cart-quote-source';
import { CartStore } from '../../../core/cart/cart-store';
import { CartLine, CartQuote, QuotedLine } from '../../../core/models/cart';
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

function setup(prepare?: (cart: CartStore) => void) {
  localStorage.clear();
  const source = { quote: vi.fn((lines: CartLine[]) => of(quoteOf(lines))) };
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: CART_QUOTE_SOURCE, useValue: source }],
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

  it('shows an empty state with a link to the books', () => {
    const { el } = setup();
    expect(el.querySelector('.empty')!.textContent).toContain('העגלה ריקה');
    expect(el.querySelector('.empty a')!.getAttribute('href')).toBe('/#books');
    expect(el.querySelector('.summary')).toBeNull();
  });

  it('lists the lines with the subtotal from the server and a shipping note', () => {
    const { el } = setup((cart) => {
      cart.addItem({ type: 'book', slug: 'a' }, 2);
      cart.addItem({ type: 'book', slug: 'b' });
    });
    expect(el.querySelectorAll('oh-cart-line')).toHaveLength(2);
    expect(el.querySelector('.subtotal')!.textContent).toContain('60');
    expect(el.querySelector('.note')!.textContent).toContain('דמי משלוח');
  });

  it('asks the server for fresh prices when the page opens', () => {
    const { source } = setup((cart) => cart.addItem({ type: 'book', slug: 'a' }));
    expect(source.quote.mock.calls.length).toBeGreaterThan(0);
  });

  it('links to checkout and back to the books', () => {
    const { el } = setup((cart) => cart.addItem({ type: 'book', slug: 'a' }));
    const hrefs = Array.from(el.querySelectorAll('.actions a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/checkout', '/#books']);
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
