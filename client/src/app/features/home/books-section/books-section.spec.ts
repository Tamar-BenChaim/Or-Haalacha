import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { BOOKS_SOURCE } from '../../../core/catalog/books-source';
import { Book } from '../../../core/models/book';
import { sampleBook, sampleSoldOutBook } from '../../../core/testing/sample-books';
import { BooksSection } from './books-section';

const shabbat: Book = { ...sampleBook, id: 'a', slug: 'a', title: 'הלכות שבת', topic: null };
const tefilla: Book = { ...sampleBook, id: 'b', slug: 'b', title: 'הלכות תפילה', topic: null };

function render(list: () => Observable<Book[]>) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: BOOKS_SOURCE, useValue: { list } }],
  });
  const fixture = TestBed.createComponent(BooksSection);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const search = (value: string) => {
    const input = el.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  return { fixture, el, search };
}

describe('BooksSection', () => {
  it('shows a card for every book and the count', () => {
    const { el } = render(() => of([shabbat, tefilla, sampleSoldOutBook]));
    expect(el.querySelectorAll('oh-book-card')).toHaveLength(3);
    expect(el.querySelector('.count')!.textContent).toContain('3 כרכים');
  });

  it('has an accessible search field', () => {
    const { el } = render(() => of([shabbat]));
    const input = el.querySelector('input[type="search"]')!;
    expect(el.querySelector(`label[for="${input.id}"]`)!.textContent).toContain('חיפוש ספר');
  });

  it('filters by the search text and reports how many are shown', () => {
    const { el, search } = render(() => of([shabbat, tefilla]));
    search('שבת');
    expect(el.querySelectorAll('oh-book-card')).toHaveLength(1);
    expect(el.querySelector('.count')!.textContent).toContain('מוצגים 1 מתוך 2');
  });

  it('says so when nothing matches', () => {
    const { el, search } = render(() => of([shabbat]));
    search('אין כזה ספר');
    expect(el.querySelectorAll('oh-book-card')).toHaveLength(0);
    expect(el.querySelector('.state')!.textContent).toContain('לא נמצאו ספרים');
  });

  it('shows an error with a retry button when loading fails', () => {
    let fail = true;
    const { fixture, el } = render(() =>
      fail ? throwError(() => new Error('down')) : of([shabbat]),
    );
    expect(el.querySelector('[role="alert"]')!.textContent).toContain('לא הצלחנו לטעון');

    fail = false;
    el.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('oh-book-card')).toHaveLength(1);
  });

  it('keeps the section id for the "Books" link to jump to', () => {
    const { el } = render(() => of([shabbat]));
    expect(el.querySelector('section#books h2')!.textContent).toContain('ספרי הסדרה');
  });
});
