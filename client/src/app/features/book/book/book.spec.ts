import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NEVER, Observable, of, throwError } from 'rxjs';

import { CART_QUOTE_SOURCE } from '../../../core/cart/cart-quote-source';
import { CartStore } from '../../../core/cart/cart-store';
import { BOOKS_SOURCE } from '../../../core/catalog/books-source';
import { Book } from '../../../core/models/book';
import { Share } from '../../../core/seo/share';
import { sampleBook } from '../../../core/testing/sample-books';
import { UiStore } from '../../../core/ui/ui-store';
import { BookPage } from './book';

const books: Book[] = Array.from({ length: 6 }, (_, i) => ({
  ...sampleBook,
  id: `b${i + 1}`,
  slug: `b${i + 1}`,
  title: `ספר ${i + 1}`,
  volume: i + 1,
  description: i === 2 ? 'תיאור מלא של ספר 3' : undefined,
}));

interface Options {
  get?: (slug: string) => Observable<Book>;
  share?: () => Promise<'shared' | 'copied' | 'failed'>;
}

async function open(url = '/book/b3', options: Options = {}, state?: Record<string, string>) {
  const get = options.get ?? ((slug: string) => of(books.find((b) => b.slug === slug)!));
  const share = vi.fn(options.share ?? (() => Promise.resolve('copied' as const)));
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'book/:slug', component: BookPage }]),
      { provide: BOOKS_SOURCE, useValue: { list: () => of(books), get } },
      { provide: CART_QUOTE_SOURCE, useValue: { quote: () => NEVER } },
      { provide: Share, useValue: { share } },
    ],
  });
  const harness = await RouterTestingHarness.create();
  if (state) {
    await TestBed.inject(Router).navigateByUrl(url, { state });
  } else {
    await harness.navigateByUrl(url);
  }
  harness.fixture.detectChanges();
  const el = harness.routeNativeElement as HTMLElement;
  return { harness, el, share, refresh: () => harness.fixture.detectChanges() };
}

describe('BookPage', () => {
  it('shows the book: title, volume, price, stock, cover and description', async () => {
    const { el } = await open();
    expect(el.querySelectorAll('h1')).toHaveLength(1);
    expect(el.querySelector('h1')!.textContent).toContain('ספר 3');
    expect(el.querySelector('.eyebrow')!.textContent).toContain('חלק 3');
    expect(el.querySelector('.price')!.textContent).toContain('65');
    expect(el.querySelector('.stock')!.textContent).toContain('במלאי');
    expect(el.querySelector('oh-book-cover')).toBeTruthy();
    expect(el.querySelector('.about')!.textContent).toContain('תיאור מלא של ספר 3');
  });

  it('sets the page title for the browser tab and for shared links', async () => {
    await open();
    expect(TestBed.inject(Title).getTitle()).toBe('ספר 3 | אור ההלכה');
  });

  describe('breadcrumbs', () => {
    const labels = (el: HTMLElement) =>
      Array.from(el.querySelectorAll('.crumbs li')).map((li) =>
        li.textContent!.replace(/[›\s]+/g, ' ').trim(),
      );

    it('lead back to the home page by default', async () => {
      const { el } = await open();
      expect(labels(el)).toEqual(['דף הבית', 'ספר 3']);
      expect(el.querySelector('.crumbs a')!.getAttribute('href')).toBe('/');
    });

    it('lead back to the cart when the visitor came from it', async () => {
      const { el } = await open('/book/b3', {}, { from: 'cart' });
      expect(labels(el)).toEqual(['עגלת הקניות', 'ספר 3']);
      expect(el.querySelector('.crumbs a')!.getAttribute('href')).toBe('/cart');
    });

    it('lead back to the set page when the visitor came from it', async () => {
      const { el } = await open('/book/b3', {}, { from: 'set' });
      expect(labels(el)).toEqual(['הסט המלא', 'ספר 3']);
    });

    it('ignore an unknown origin', async () => {
      const { el } = await open('/book/b3', {}, { from: '<script>' });
      expect(labels(el)).toEqual(['דף הבית', 'ספר 3']);
    });
  });

  describe('buying', () => {
    it('adds the chosen quantity to the cart and opens the side cart', async () => {
      const { el, refresh } = await open();
      el.querySelector<HTMLButtonElement>('button[aria-label="הגדלת כמות"]')!.click();
      refresh();
      el.querySelector<HTMLButtonElement>('button.add')!.click();
      expect(TestBed.inject(CartStore).lines()).toEqual([
        { ref: { type: 'book', slug: 'b3' }, quantity: 2 },
      ]);
      expect(TestBed.inject(UiStore).drawerOpen()).toBe(true);
    });

    it('does not go below one copy', async () => {
      const { el } = await open();
      const minus = el.querySelector<HTMLButtonElement>('button[aria-label="הפחתת כמות"]')!;
      expect(minus.disabled).toBe(true);
    });

    it('also has a fixed buy bar for phones', async () => {
      const { el } = await open();
      el.querySelector<HTMLButtonElement>('.sticky-buy button')!.click();
      expect(TestBed.inject(CartStore).count()).toBe(1);
    });

    it('cannot buy a sold out book, and says so', async () => {
      const soldOut = { ...books[2], inStock: false };
      const { el } = await open('/book/b3', { get: () => of(soldOut) });
      expect(el.querySelector('.out')!.textContent).toContain('הספר אזל במלאי כרגע');
      expect(el.querySelector('.info button.add')).toBeNull();
      expect(el.querySelector('oh-qty-stepper')).toBeNull();
      expect(el.querySelector('.sticky-buy')).toBeNull();
      expect(el.querySelector('.soldout-label')!.textContent).toContain('אזל במלאי');
    });

    it('points to the full set', async () => {
      const { el } = await open();
      expect(el.querySelector('.set-note a')!.getAttribute('href')).toBe('/set');
    });
  });

  describe('sharing', () => {
    it('says the link was copied', async () => {
      const { el, share, refresh } = await open();
      el.querySelector<HTMLButtonElement>('.share button')!.click();
      await Promise.resolve();
      await Promise.resolve();
      refresh();
      expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: 'ספר 3' }));
      expect(el.querySelector('[role="status"]')!.textContent).toContain('הקישור הועתק');
    });

    it('stays quiet when the share sheet was used', async () => {
      const { el, refresh } = await open('/book/b3', { share: () => Promise.resolve('shared') });
      el.querySelector<HTMLButtonElement>('.share button')!.click();
      await Promise.resolve();
      await Promise.resolve();
      refresh();
      expect(el.querySelector('[role="status"]')).toBeNull();
    });
  });

  describe('neighbors in the series', () => {
    it('links the previous and next volume', async () => {
      const { el } = await open();
      const links = Array.from(el.querySelectorAll('.volumes a'));
      expect(links.map((a) => a.getAttribute('href'))).toEqual(['/book/b2', '/book/b4']);
      expect(links[0].textContent).toContain('הכרך הקודם: ספר 2');
      expect(links[1].textContent).toContain('הכרך הבא: ספר 4');
    });

    it('goes around: after the last volume comes the first', async () => {
      const { el } = await open('/book/b6');
      const links = Array.from(el.querySelectorAll('.volumes a')).map((a) =>
        a.getAttribute('href'),
      );
      expect(links).toEqual(['/book/b5', '/book/b1']);
    });

    it('shows four more books from the series, not the current one', async () => {
      const { el } = await open();
      const titles = Array.from(el.querySelectorAll('.related oh-book-card h3')).map((h) =>
        h.textContent!.trim(),
      );
      expect(titles).toEqual(['ספר 4', 'ספר 5', 'ספר 6', 'ספר 1']);
    });

    it('adds a related book to the cart from its card', async () => {
      const { el } = await open();
      el.querySelector<HTMLButtonElement>('.related button.add')!.click();
      expect(TestBed.inject(CartStore).lines()[0].ref).toEqual({ type: 'book', slug: 'b4' });
    });
  });

  describe('when something goes wrong', () => {
    it('says the book was not found for an unknown address (404)', async () => {
      const { el } = await open('/book/nope', {
        get: () => throwError(() => new HttpErrorResponse({ status: 404 })),
      });
      expect(el.querySelector('h1')!.textContent).toContain('הספר לא נמצא');
      expect(el.querySelector('a.btn')!.getAttribute('href')).toBe('/#books');
      expect(TestBed.inject(Title).getTitle()).toContain('הספר לא נמצא');
    });

    it('shows an error with a retry button for other failures', async () => {
      let fail = true;
      const { el, refresh } = await open('/book/b3', {
        get: () => (fail ? throwError(() => new HttpErrorResponse({ status: 500 })) : of(books[2])),
      });
      expect(el.querySelector('[role="alert"]')!.textContent).toContain('לא הצלחנו לטעון');
      fail = false;
      el.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
      refresh();
      expect(el.querySelector('h1')!.textContent).toContain('ספר 3');
    });

    it('shows a loading state while the book is on its way', async () => {
      const { el } = await open('/book/b3', { get: () => NEVER });
      expect(el.querySelector('[aria-busy="true"]')).toBeTruthy();
    });
  });
});
