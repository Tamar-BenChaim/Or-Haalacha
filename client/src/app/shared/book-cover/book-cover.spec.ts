import { TestBed } from '@angular/core/testing';

import { sampleBook, sampleBookWithImage } from '../../core/testing/sample-books';
import { BookCover } from './book-cover';

function render(book: typeof sampleBook, decorative = false) {
  const fixture = TestBed.createComponent(BookCover);
  fixture.componentRef.setInput('book', book);
  fixture.componentRef.setInput('decorative', decorative);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('BookCover', () => {
  it('draws a CSS cover with title, topic and volume when there is no image', () => {
    const el = render(sampleBook);
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent).toContain(sampleBook.title);
    expect(el.textContent).toContain('נושא לדוגמה');
    expect(el.textContent).toContain('כרך 1');
  });

  it('omits the topic when it is missing', () => {
    const el = render({ ...sampleBook, topic: null });
    expect(el.querySelector('.topic')).toBeNull();
  });

  it('shows the real image, lazy loaded, with the alt text on the host', () => {
    const el = render(sampleBookWithImage);
    const img = el.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('/cover.jpg');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('כריכת ספר לדוגמה ג׳');
  });

  it('is hidden from screen readers when decorative', () => {
    const el = render(sampleBook, true);
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('role')).toBeNull();
  });
});
