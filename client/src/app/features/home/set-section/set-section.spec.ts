import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NEVER, Observable, of, throwError } from 'rxjs';

import { CART_QUOTE_SOURCE } from '../../../core/cart/cart-quote-source';
import { CartStore } from '../../../core/cart/cart-store';
import { BUNDLES_SOURCE } from '../../../core/catalog/bundles-source';
import { Bundle } from '../../../core/models/book';
import { sampleBook } from '../../../core/testing/sample-books';
import { SetSection } from './set-section';

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
  const fixture = TestBed.createComponent(SetSection);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('SetSection', () => {
  it('is the #set section with an h2 (the page has one h1, in the hero)', () => {
    const { el } = render(() => of([fullSet]));
    const section = el.querySelector('section#set')!;
    expect(section.getAttribute('aria-labelledby')).toBe('set-title');
    expect(el.querySelector('h1')).toBeNull();
    expect(el.querySelector('#set-title')!.tagName).toBe('H2');
    expect(el.querySelector('#set-title')!.textContent).toContain('הסט המלא');
    expect(el.querySelector('.eyebrow')!.textContent).toContain('הצעה מיוחדת');
  });

  it('keeps the heading while loading and on error, so the link target always has a title', () => {
    expect(render(() => NEVER).el.querySelector('#set-title')!.textContent).toContain('הסט המלא');
  });

  it('shows the set price, the price of buying separately and the saving', () => {
    const { el } = render(() => of([fullSet]));
    expect(el.querySelector('.price')!.textContent).toContain('900');
    expect(el.querySelector('.was')!.textContent).toContain('1,200');
    expect(el.querySelector('.saving')!.textContent).toContain('300');
  });

  it('hides the old price and the saving when it cannot be told', () => {
    const { el } = render(() => of([{ ...fullSet, separatePriceAgorot: null }]));
    expect(el.querySelector('.was')).toBeNull();
    expect(el.querySelector('.saving')).toBeNull();
  });

  it('hides the saving when the separate price is not higher', () => {
    const { el } = render(() => of([{ ...fullSet, separatePriceAgorot: 90000 }]));
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
    expect(items[1].querySelector('.n')!.textContent).toContain('2');
  });

  it('labels the list of books with its own heading (h3, under the section h2)', () => {
    const { el } = render(() => of([fullSet]));
    expect(el.querySelector('#list-title')!.tagName).toBe('H3');
    expect(el.querySelector('ul')!.getAttribute('aria-labelledby')).toBe('list-title');
  });

  it('shows an error with a retry button', () => {
    let fail = true;
    const { fixture, el } = render(() => (fail ? throwError(() => new Error('x')) : of([fullSet])));
    expect(el.querySelector('[role="alert"]')!.textContent).toContain('לא הצלחנו לטעון');
    fail = false;
    el.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.price')).toBeTruthy();
  });

  it('shows a loading state before the set arrives', () => {
    expect(render(() => NEVER).el.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
