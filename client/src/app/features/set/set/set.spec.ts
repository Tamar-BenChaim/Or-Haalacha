import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NEVER, Observable, of, throwError } from 'rxjs';

import { CART_QUOTE_SOURCE } from '../../../core/cart/cart-quote-source';
import { CartStore } from '../../../core/cart/cart-store';
import { BUNDLES_SOURCE } from '../../../core/catalog/bundles-source';
import { Bundle } from '../../../core/models/book';
import { sampleBook } from '../../../core/testing/sample-books';
import { SetPage } from './set';

const books = [
  { ...sampleBook, id: 'a', slug: 'a', title: 'ספר א', volume: 1 },
  { ...sampleBook, id: 'b', slug: 'b', title: 'ספר ב', volume: null },
];
const fullSet: Bundle = {
  id: 's',
  slug: 'full-set',
  title: 'הסט המלא – 20 כרכים',
  description: 'כל הספרים יחד.',
  priceAgorot: 90000,
  separatePriceAgorot: 120000,
  inStock: true,
  books,
};

function render(list: () => Observable<Bundle[]>) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: BUNDLES_SOURCE, useValue: { list } },
      { provide: CART_QUOTE_SOURCE, useValue: { quote: () => NEVER } },
    ],
  });
  const fixture = TestBed.createComponent(SetPage);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('SetPage', () => {
  it('has the breadcrumbs, a single h1 and the intro', () => {
    const { el } = render(() => of([fullSet]));
    expect(el.querySelector('nav[aria-label="פירורי לחם"]')).toBeTruthy();
    expect(el.querySelectorAll('h1')).toHaveLength(1);
    expect(el.querySelector('h1')!.textContent).toContain('הסט המלא');
    expect(el.querySelector('.eyebrow')!.textContent).toContain('הצעה מיוחדת');
  });

  it('shows the set price, the price of buying separately and the saving', () => {
    const { el } = render(() => of([fullSet]));
    expect(el.querySelector('.price')!.textContent).toContain('900');
    expect(el.querySelector('.was')!.textContent).toContain('1,200');
    expect(el.querySelector('.saving')!.textContent).toContain('300');
  });

  it('hides the old price and the saving when it cannot be told or is not a saving', () => {
    const { el } = render(() => of([{ ...fullSet, separatePriceAgorot: null }]));
    expect(el.querySelector('.was')).toBeNull();
    expect(el.querySelector('.saving')).toBeNull();
  });

  it('adds the set to the cart', () => {
    const { el } = render(() => of([fullSet]));
    el.querySelector<HTMLButtonElement>('button.add')!.click();
    expect(TestBed.inject(CartStore).lines()).toEqual([
      { ref: { type: 'bundle', slug: 'full-set' }, quantity: 1 },
    ]);
  });

  it('cannot add a sold out set', () => {
    const { el } = render(() => of([{ ...fullSet, inStock: false }]));
    expect(el.querySelector('button.add')).toBeNull();
    expect(el.querySelector('.out')!.textContent).toContain('אזל');
  });

  it('shows the shelf and the list of books, linking each to its page', () => {
    const { el } = render(() => of([fullSet]));
    expect(el.querySelectorAll('oh-shelf a.spine')).toHaveLength(2);
    const items = el.querySelectorAll('.list li');
    expect(items).toHaveLength(2);
    expect(items[0].querySelector('a')!.getAttribute('href')).toBe('/book/a');
    expect(items[0].textContent).toContain('1');
    expect(items[1].querySelector('.n')!.textContent).toContain('2');
  });

  it('shows an error with a retry button', () => {
    let fail = true;
    const { fixture, el } = render(() => (fail ? throwError(() => new Error('x')) : of([fullSet])));
    expect(el.querySelector('[role="alert"]')!.textContent).toContain('לא הצלחנו לטעון');
    fail = false;
    el.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    fixture.detectChanges();
    expect(el.querySelector('h1')).toBeTruthy();
  });

  it('shows a loading state before the set arrives', () => {
    const { el } = render(() => NEVER);
    expect(el.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
