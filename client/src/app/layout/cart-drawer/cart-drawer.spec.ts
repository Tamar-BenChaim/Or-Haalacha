import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CART_QUOTE_SOURCE } from '../../core/cart/cart-quote-source';
import { CartStore } from '../../core/cart/cart-store';
import { CartLine, CartQuote, QuotedLine } from '../../core/models/cart';
import { UiStore } from '../../core/ui/ui-store';
import { CartDrawer } from './cart-drawer';

function quoteOf(lines: CartLine[]): CartQuote {
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
    subtotalAgorot: items.reduce((s, i) => s + i.lineTotalAgorot, 0),
    allAvailable: true,
  };
}

function setup(quote: (lines: CartLine[]) => CartQuote = quoteOf) {
  localStorage.clear();
  const source = { quote: vi.fn((lines: CartLine[]) => of(quote(lines))) };
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: CART_QUOTE_SOURCE, useValue: source }],
  });
  const fixture = TestBed.createComponent(CartDrawer);
  const ui = TestBed.inject(UiStore);
  const cart = TestBed.inject(CartStore);
  const el = fixture.nativeElement as HTMLElement;
  const refresh = () => fixture.detectChanges();
  refresh();
  return { fixture, el, ui, cart, source, refresh };
}

describe('CartDrawer', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('renders nothing while closed', () => {
    const { el } = setup();
    expect(el.querySelector('aside')).toBeNull();
  });

  it('is an accessible modal dialog when open', () => {
    const { el, ui, refresh } = setup();
    ui.openDrawer();
    refresh();
    const dialog = el.querySelector('aside')!;
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('עגלת קניות');
  });

  it('shows an empty state with a way back to the books', () => {
    const { el, ui, refresh } = setup();
    ui.openDrawer();
    refresh();
    expect(el.querySelector('.empty')!.textContent).toContain('העגלה ריקה');
    expect(el.querySelector('.empty a')!.getAttribute('href')).toBe('/#books');
  });

  it('lists the items with the server subtotal and both buttons', () => {
    const { el, ui, cart, refresh } = setup();
    cart.addItem({ type: 'book', slug: 'a' }, 2);
    cart.addItem({ type: 'book', slug: 'b' });
    refresh();
    expect(ui.drawerOpen()).toBe(true);
    expect(el.querySelectorAll('oh-cart-line')).toHaveLength(2);
    expect(el.querySelector('.subtotal')!.textContent).toContain('30');
    const hrefs = Array.from(el.querySelectorAll('.actions a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/cart', '/checkout']);
  });

  it('asks the server again when it opens', () => {
    const { ui, cart, source, refresh } = setup();
    cart.addItem({ type: 'book', slug: 'a' });
    source.quote.mockClear();
    ui.closeDrawer();
    refresh();
    ui.openDrawer();
    refresh();
    expect(source.quote).toHaveBeenCalled();
  });

  it('allows checkout when every item is available', () => {
    const { el, cart, refresh } = setup();
    cart.addItem({ type: 'book', slug: 'a' });
    refresh();
    const checkout = el.querySelector('.actions a.btn')!;
    expect(checkout.getAttribute('aria-disabled')).toBeNull();
    expect(checkout.getAttribute('href')).toBe('/checkout');
  });

  it('blocks checkout while an item is sold out', () => {
    const { el, cart, refresh } = setup((lines) => {
      const quote = quoteOf(lines);
      quote.items[0] = { ...quote.items[0], status: 'out_of_stock', lineTotalAgorot: 0 };
      quote.allAvailable = false;
      return quote;
    });
    cart.addItem({ type: 'book', slug: 'a' });
    refresh();
    const checkout = el.querySelector('.actions a.btn')!;
    expect(checkout.getAttribute('aria-disabled')).toBe('true');
    expect(checkout.getAttribute('href')).toBeNull();
  });

  it('closes with the close button, the dark background and the Escape key', () => {
    const { el, ui, refresh } = setup();
    const open = () => {
      ui.openDrawer();
      refresh();
    };

    open();
    el.querySelector<HTMLButtonElement>('button.close')!.click();
    refresh();
    expect(ui.drawerOpen()).toBe(false);

    open();
    el.querySelector<HTMLButtonElement>('button.backdrop')!.click();
    refresh();
    expect(ui.drawerOpen()).toBe(false);

    open();
    el.querySelector('aside')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    refresh();
    expect(ui.drawerOpen()).toBe(false);
  });

  it('stops the page behind it from scrolling while open', () => {
    const { ui, refresh } = setup();
    ui.openDrawer();
    refresh();
    expect(document.body.style.overflow).toBe('hidden');
    ui.closeDrawer();
    refresh();
    expect(document.body.style.overflow).toBe('');
  });

  it('removes an item from the cart through its row', () => {
    const { el, cart, refresh } = setup();
    cart.addItem({ type: 'book', slug: 'a' });
    refresh();
    el.querySelector<HTMLButtonElement>('button.remove')!.click();
    refresh();
    expect(cart.isEmpty()).toBe(true);
    expect(el.querySelector('.empty')).toBeTruthy();
  });
});
