import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SHOW_CONTENT_PLACEHOLDERS } from '../../../core/config/content-placeholders';
import { Hero } from './hero';

function render(placeholders = true) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: SHOW_CONTENT_PLACEHOLDERS, useValue: placeholders }],
  });
  const fixture = TestBed.createComponent(Hero);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('Hero', () => {
  it('has the site name as the one h1 (hidden to the eye: the big title is decoration)', () => {
    const el = render();
    expect(el.querySelectorAll('h1')).toHaveLength(1);
    expect(el.querySelector('h1')!.textContent).toContain('אור ההלכה');
    expect(el.querySelector('h1')!.classList.contains('visually-hidden')).toBe(true);
    expect(el.querySelector('section')!.getAttribute('aria-labelledby')).toBe('hero-title');
  });

  it('shows the series line above the title and the 3D title (CSS, no picture)', () => {
    const el = render();
    expect(el.querySelector('.eyebrow')!.textContent).toContain('סדרת ספרי הלכה');
    expect(el.querySelector('oh-hero-title')).toBeTruthy();
    expect(el.querySelector('img')).toBeNull();
  });

  it('has the two buttons: all the books, and the full set (gold and outlined)', () => {
    const [books, set] = Array.from(el(render()).querySelectorAll('.actions a'));
    expect(books.textContent).toContain('לכל הספרים');
    expect(books.getAttribute('href')).toBe('/#books');
    expect(books.classList.contains('gold')).toBe(true);
    expect(set.textContent).toContain('הסט המלא');
    expect(set.getAttribute('href')).toBe('/#set');
    expect(set.classList.contains('ghost')).toBe(true);
  });

  it('has no gold frame around the title', () => {
    const el = render();
    expect(el.querySelector('.frame, .corner, .cn')).toBeNull();
  });

  describe('the sparkles', () => {
    it('are five, decoration only (hidden from screen readers)', () => {
      const sparks = Array.from(render().querySelectorAll('.spark'));
      expect(sparks).toHaveLength(5);
      for (const spark of sparks) {
        expect(spark.getAttribute('aria-hidden')).toBe('true');
        expect(spark.querySelector('.star')).toBeTruthy();
      }
    });

    it('each have their own place (s1 to s5), so they are spread around the title', () => {
      const classes = Array.from(render().querySelectorAll('.spark')).map((s) =>
        Array.from(s.classList).find((c) => /^s\d$/.test(c)),
      );
      expect(classes).toEqual(['s1', 's2', 's3', 's4', 's5']);
    });

    it('cannot be clicked or focused (they must not get in the way)', () => {
      const el = render();
      expect(el.querySelectorAll('.spark a, .spark button, .spark [tabindex]')).toHaveLength(0);
    });
  });

  describe('text that comes from the client', () => {
    it('shows sample lines in development, like the mockup', () => {
      const el = render(true);
      expect(el.querySelector('.sub')!.textContent).toContain('[משפט משנה על הסדרה]');
      expect(el.querySelector('.meta')!.textContent).toContain('מאת הרב [שם המחבר]');
    });

    it('shows no sample text in production', () => {
      const el = render(false);
      expect(el.querySelector('.sub')).toBeNull();
      expect(el.querySelector('.meta')).toBeNull();
      expect(el.textContent).not.toContain('[');
    });
  });
});

// A small helper so a test can read naturally.
function el(element: HTMLElement): HTMLElement {
  return element;
}
