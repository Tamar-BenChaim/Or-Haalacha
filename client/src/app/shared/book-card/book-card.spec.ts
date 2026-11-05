import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Book } from '../../core/models/book';
import { sampleBook, sampleSoldOutBook } from '../../core/testing/sample-books';
import { BookCard } from './book-card';

function render(book: Book) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(BookCard);
  fixture.componentRef.setInput('book', book);
  fixture.detectChanges();
  const emitted: Book[] = [];
  fixture.componentInstance.addToCart.subscribe((b) => emitted.push(b));
  return { el: fixture.nativeElement as HTMLElement, emitted };
}

describe('BookCard', () => {
  it('shows the title as a link to the book page and the price', () => {
    const { el } = render(sampleBook);
    const link = el.querySelector('.name a')!;
    expect(link.textContent).toContain(sampleBook.title);
    expect(link.getAttribute('href')).toBe('/book/sample-book-1');
    expect(el.querySelector('.price')!.textContent).toContain('65');
  });

  it('emits addToCart with the book when the button is clicked', () => {
    const { el, emitted } = render(sampleBook);
    el.querySelector<HTMLButtonElement>('button.add')!.click();
    expect(emitted).toEqual([sampleBook]);
  });

  it('gives the button an accessible name that includes the title', () => {
    const { el } = render(sampleBook);
    expect(el.querySelector('button')!.getAttribute('aria-label')).toBe(
      `הוספה לעגלה: ${sampleBook.title}`,
    );
  });

  it('marks a sold out book and disables the button', () => {
    const { el, emitted } = render(sampleSoldOutBook);
    const button = el.querySelector<HTMLButtonElement>('button.add')!;
    expect(el.querySelector('.soldout-label')!.textContent).toContain('אזל במלאי');
    expect(button.disabled).toBe(true);
    button.click();
    expect(emitted).toEqual([]);
  });

  it('does not show the sold out label for an available book', () => {
    expect(render(sampleBook).el.querySelector('.soldout-label')).toBeNull();
  });
});
