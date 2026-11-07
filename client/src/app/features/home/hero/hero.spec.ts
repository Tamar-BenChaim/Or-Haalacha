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

  it('shows the 3D title (CSS, no picture) and not the words "סדרת ספרי הלכה"', () => {
    const el = render();
    expect(el.querySelector('oh-hero-title')).toBeTruthy();
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('.eyebrow')).toBeNull();
    expect(el.textContent).not.toContain('סדרת ספרי הלכה');
  });

  it('is a burgundy band across the whole page that fills the screen under the header', () => {
    render();
    expect(styleOf('hero')).toMatch(/min-block-size:\s*calc\(100svh/);
    expect(styleOf('hero')).toContain('radial-gradient');
    expect(allHeroStyles()).toMatch(/_nghost[^{]*\{[^}]*display:\s*block/);
  });

  it('keeps the content in the middle at its normal width', () => {
    render();
    expect(styleOf('inner')).toMatch(/max-inline-size:\s*1240px/);
    expect(styleOf('inner')).toMatch(/margin-inline:\s*auto/);
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

    describe('stay away from the header', () => {
      const place = (el: HTMLElement, n: number) => getComputedStyle(el.querySelector(`.s${n}`)!);

      it('every sparkle with a top is at least 56px below the top edge, so the glow never touches the header', () => {
        const el = render();
        for (const n of [1, 2, 4, 5]) {
          expect(parseFloat(place(el, n).top), `s${n}`).toBeGreaterThanOrEqual(56);
        }
      });

      it('no sparkle sticks out of the sides (none has a negative position)', () => {
        const el = render();
        for (let n = 1; n <= 5; n++) {
          const style = place(el, n);
          for (const side of [style.left, style.right]) {
            if (side !== '') {
              expect(parseFloat(side), `s${n}`).toBeGreaterThanOrEqual(0);
            }
          }
        }
      });

      it('the hero leaves room above the title for them', () => {
        render();
        expect(styleOf('inner')).toMatch(/padding:\s*96px/);
      });
    });

    describe('the animation', () => {
      it('runs once when the page opens and does not repeat', () => {
        render();
        const css = styleOf('spark');
        expect(css).toContain('spark-open');
        expect(css).not.toMatch(/infinite/);
        expect(css).not.toContain('spark-twinkle');
      });

      it('has no repeating animation anywhere in the hero', () => {
        render();
        expect(allHeroStyles()).not.toMatch(/infinite/);
      });

      it('grows past its size and glows in the middle, then settles at its normal size', () => {
        render();
        const css = allHeroStyles();
        expect(css).toMatch(/55%[^}]*scale\(1\.35\)/);
        expect(css).toMatch(/100%[^}]*scale\(1\)/);
      });
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

/** The styles of the hero component, as text (jsdom does not run animations or container units). */
function allHeroStyles(): string {
  return Array.from(document.head.querySelectorAll('style'))
    .map((style) => style.textContent ?? '')
    .filter((css) => css.includes('spark-open'))
    .join('\n');
}

/** The rule of one class of the hero, as text. */
function styleOf(className: string): string {
  const css = allHeroStyles();
  const match = new RegExp(`\\.${className}[^{]*\\{([^}]*)\\}`).exec(css);
  return match ? match[1] : '';
}
