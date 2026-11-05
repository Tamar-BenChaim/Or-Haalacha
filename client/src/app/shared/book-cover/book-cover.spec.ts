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
  it('draws a CSS cover with logo, topic and part number when there is no image', () => {
    const el = render(sampleBook);
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('.cv-logo')!.textContent).toContain('אור ההלכה');
    expect(el.querySelector('.cv-topic')!.textContent).toContain('נושא לדוגמה');
    expect(el.querySelector('.cv-n')!.textContent).toContain('חלק 1');
  });

  it('shows the title instead of the topic when the topic is missing', () => {
    const el = render({ ...sampleBook, topic: null });
    expect(el.querySelector('.cv-topic')!.textContent).toContain(sampleBook.title);
  });

  it('leaves the part number empty when the book has no volume', () => {
    const el = render({ ...sampleBook, volume: null });
    expect(el.querySelector('.cv-n')!.textContent!.trim()).toBe('');
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
