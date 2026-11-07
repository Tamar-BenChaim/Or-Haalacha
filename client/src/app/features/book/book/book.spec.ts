import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NEVER, Observable, of, throwError } from 'rxjs';

import { CART_QUOTE_SOURCE } from '../../../core/cart/cart-quote-source';
import { CartStore } from '../../../core/cart/cart-store';
import { BOOKS_SOURCE } from '../../../core/catalog/books-source';
import { SHOW_CONTENT_PLACEHOLDERS } from '../../../core/config/content-placeholders';
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
  /** Sample boxes for missing content (development). Default: on. */
  placeholders?: boolean;
}

const page = (overrides: Partial<Book>) => (slug: string) =>
  of({ ...books.find((b) => b.slug === slug)!, ...overrides });

async function open(url = '/book/b3', options: Options = {}, state?: Record<string, string>) {
  const get = options.get ?? ((slug: string) => of(books.find((b) => b.slug === slug)!));
  const share = vi.fn(options.share ?? (() => Promise.resolve('copied' as const)));
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'book/:slug', component: BookPage }]),
      { provide: BOOKS_SOURCE, useValue: { list: () => of(books), get } },
      { provide: CART_QUOTE_SOURCE, useValue: { quote: () => NEVER } },
      { provide: Share, useValue: { share } },
      { provide: SHOW_CONTENT_PLACEHOLDERS, useValue: options.placeholders ?? true },
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
      expect(el.querySelector('.crumbs a')!.getAttribute('href')).toBe('/#set');
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
      expect(el.querySelector('.set-note a')!.getAttribute('href')).toBe('/#set');
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

  describe('pictures of the book', () => {
    it('shows the gallery next to the details', async () => {
      const { el } = await open();
      expect(el.querySelector('.top oh-book-gallery')).toBeTruthy();
      expect(el.querySelectorAll('.thumb')).toHaveLength(4);
    });

    it('shows only real pictures in production', async () => {
      const { el } = await open('/book/b3', { placeholders: false });
      expect(el.querySelectorAll('.thumb')).toHaveLength(0);
      expect(el.querySelector('oh-book-cover')).toBeTruthy();
    });

    it('shows the pictures the book has', async () => {
      const images = [{ kind: 'back' as const, url: '/back.jpg', alt: 'אחורית' }];
      const { el } = await open('/book/b3', { get: page({ images }), placeholders: false });
      expect(el.querySelectorAll('.thumb')).toHaveLength(2);
    });
  });

  describe('about the book and a look inside', () => {
    const toggle = (el: HTMLElement) =>
      el.querySelector<HTMLButtonElement>('button.preview-toggle')!;

    it('shows the description under "על הספר"', async () => {
      const { el } = await open();
      expect(el.querySelector('#about-title')!.textContent).toContain('על הספר');
      expect(el.querySelector('.about')!.textContent).toContain('תיאור מלא של ספר 3');
    });

    it('opens and closes three sample pages with the button, and says so to screen readers', async () => {
      const { el, refresh } = await open();
      expect(toggle(el).textContent).toContain('עיון בספר – עמודים לדוגמה');
      expect(toggle(el).getAttribute('aria-expanded')).toBe('false');
      expect(el.querySelector('#preview')).toBeNull();

      toggle(el).click();
      refresh();
      expect(toggle(el).getAttribute('aria-expanded')).toBe('true');
      expect(toggle(el).getAttribute('aria-controls')).toBe('preview');
      const boxes = Array.from(el.querySelectorAll('#preview .ph')).map((b) =>
        b.textContent!.trim(),
      );
      expect(boxes).toEqual(['[תוכן עניינים]', '[עמוד א׳]', '[עמוד ב׳]']);

      toggle(el).click();
      refresh();
      expect(el.querySelector('#preview')).toBeNull();
      expect(toggle(el).getAttribute('aria-expanded')).toBe('false');
    });

    it('shows the real pages of the book, with alt text', async () => {
      const images = [
        { kind: 'contents' as const, url: '/c.jpg', alt: 'תוכן' },
        { kind: 'sample' as const, url: '/s1.jpg', alt: '' },
        { kind: 'back' as const, url: '/b.jpg', alt: 'אחורית' },
      ];
      const { el, refresh } = await open('/book/b3', {
        get: page({ images }),
        placeholders: false,
      });
      toggle(el).click();
      refresh();
      const pages = Array.from(el.querySelectorAll<HTMLImageElement>('#preview img'));
      expect(pages.map((p) => p.getAttribute('src'))).toEqual(['/c.jpg', '/s1.jpg']);
      expect(pages[0].getAttribute('alt')).toBe('תוכן');
      expect(pages[1].getAttribute('alt')).toContain('ספר 3');
    });

    it('has no look inside in production when the book has no sample pages', async () => {
      const { el } = await open('/book/b3', { placeholders: false });
      expect(el.querySelector('button.preview-toggle')).toBeNull();
    });

    it('closes the look inside when another book is opened', async () => {
      const { harness, el, refresh } = await open();
      toggle(el).click();
      refresh();
      await harness.navigateByUrl('/book/b4');
      refresh();
      expect(el.querySelector('#preview')).toBeNull();
    });
  });

  describe('details of the book', () => {
    const rows = (el: HTMLElement) =>
      Array.from(el.querySelectorAll('.tbl tr')).map((tr) => [
        tr.querySelector('th')!.textContent!.trim(),
        tr.querySelector('td')!.textContent!.trim(),
      ]);

    it('lists the four details, with a sample "[—]" for each missing one (development)', async () => {
      const { el } = await open();
      expect(el.querySelector('#facts-title')!.textContent).toContain('פרטי הספר');
      expect(rows(el)).toEqual([
        ['מספר עמודים', '[—]'],
        ['גודל', '[—]'],
        ['כריכה', '[—]'],
        ['שנת הוצאה', '[—]'],
      ]);
    });

    it('shows the real values', async () => {
      const details = { pages: 320, size: '17×24 ס״מ', binding: 'קשה', year: 2025 };
      const { el } = await open('/book/b3', { get: page({ details }) });
      expect(rows(el)).toEqual([
        ['מספר עמודים', '320'],
        ['גודל', '17×24 ס״מ'],
        ['כריכה', 'קשה'],
        ['שנת הוצאה', '2025'],
      ]);
    });

    it('in production shows only the details the book has', async () => {
      const details = { pages: 320, size: null, binding: '', year: 2025 };
      const { el } = await open('/book/b3', { get: page({ details }), placeholders: false });
      expect(rows(el)).toEqual([
        ['מספר עמודים', '320'],
        ['שנת הוצאה', '2025'],
      ]);
    });

    it('in production has no table at all when there are no details', async () => {
      const { el } = await open('/book/b3', { placeholders: false });
      expect(el.querySelector('.tbl')).toBeNull();
      expect(el.querySelector('#facts-title')).toBeNull();
    });
  });

  describe('order for a synagogue or a yeshiva', () => {
    it('has the box with a link to the contact section', async () => {
      const { el } = await open();
      const box = el.querySelector('.order')!;
      expect(box.querySelector('.order-title')!.textContent).toContain('הזמנה לבית כנסת או ישיבה?');
      expect(box.querySelector('a')!.textContent).toContain('צרו קשר להזמנה מוסדית');
      expect(box.querySelector('a')!.getAttribute('href')).toBe('/#contact');
    });

    it('shows the "to be decided" note only in development', async () => {
      expect((await open()).el.querySelector('.order-note')).toBeTruthy();
      TestBed.resetTestingModule();
      const production = await open('/book/b3', { placeholders: false });
      expect(production.el.querySelector('.order-note')).toBeNull();
      expect(production.el.querySelector('.order a')).toBeTruthy();
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
