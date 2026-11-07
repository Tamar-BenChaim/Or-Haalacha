import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Book } from '../../../../core/models/book';
import { sampleBook } from '../../../../core/testing/sample-books';
import { Shelf } from './shelf';

const books: Book[] = Array.from({ length: 5 }, (_, i) => ({
  ...sampleBook,
  id: `b${i}`,
  slug: `book-${i}`,
  title: `ספר ${i}`,
  topic: i === 0 ? null : `נושא ${i}`,
  priceAgorot: 6500,
}));

function render() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(Shelf);
  fixture.componentRef.setInput('books', books);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const spines = () => Array.from(el.querySelectorAll<HTMLAnchorElement>('a.spine'));
  return { fixture, el, spines };
}

describe('Shelf', () => {
  it('shows a spine for each book, as a link to the book with its name', () => {
    const { spines } = render();
    expect(spines()).toHaveLength(5);
    expect(spines()[2].getAttribute('href')).toBe('/book/book-2');
    expect(spines()[2].getAttribute('aria-label')).toBe('ספר 2');
  });

  it('writes the topic on the spine, or the title when there is no topic', () => {
    const { spines } = render();
    expect(spines()[0].textContent).toContain('ספר 0');
    expect(spines()[1].textContent).toContain('נושא 1');
  });

  it('groups the spines with a label', () => {
    const { el } = render();
    expect(el.querySelector('[role="group"]')!.getAttribute('aria-label')).toBe(
      'ספרי הסדרה על המדף',
    );
  });

  it('gives the spines slightly different heights between 86% and 100%', () => {
    const { spines } = render();
    const heights = spines().map((s) => parseFloat(s.style.height));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(86);
    expect(Math.max(...heights)).toBeLessThanOrEqual(100);
    expect(new Set(heights).size).toBeGreaterThan(1);
  });

  it('shows the name and price of the hovered or focused book, and the hint otherwise', () => {
    const { fixture, el, spines } = render();
    const caption = () => el.querySelector('.caption')!;
    expect(caption().textContent).toContain('לחיצה פותחת את דף הספר');

    spines()[1].dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    expect(caption().textContent).toContain('ספר 1');
    expect(caption().textContent).toContain('65');

    spines()[1].dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    expect(caption().textContent).toContain('לחיצה פותחת את דף הספר');

    spines()[3].dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(caption().textContent).toContain('ספר 3');
  });

  it('announces the caption politely', () => {
    expect(render().el.querySelector('.caption')!.getAttribute('aria-live')).toBe('polite');
  });
});
