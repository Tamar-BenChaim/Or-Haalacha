import { TestBed } from '@angular/core/testing';

import { Book, BookImage } from '../../../core/models/book';
import { sampleBook } from '../../../core/testing/sample-books';
import { BookGallery } from './book-gallery';

const image = (kind: BookImage['kind'], url = `/${kind}.jpg`): BookImage => ({
  kind,
  url,
  alt: `תמונה: ${kind}`,
});

function render(book: Book = sampleBook, placeholders = false) {
  const fixture = TestBed.createComponent(BookGallery);
  fixture.componentRef.setInput('book', book);
  fixture.componentRef.setInput('placeholders', placeholders);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const thumbs = () => Array.from(el.querySelectorAll<HTMLButtonElement>('.thumb'));
  const labels = () => thumbs().map((t) => t.getAttribute('aria-label'));
  const pick = (label: string) => {
    thumbs()
      .find((t) => t.getAttribute('aria-label') === label)!
      .click();
    fixture.detectChanges();
  };
  return { fixture, el, thumbs, labels, pick };
}

describe('BookGallery', () => {
  describe('a book with no pictures of its own (production)', () => {
    it('shows the drawn front cover and no thumbnails (there is nothing to choose between)', () => {
      const { el, thumbs } = render();
      expect(el.querySelector('oh-book-cover')).toBeTruthy();
      expect(el.querySelector('.ph')).toBeNull();
      expect(thumbs()).toHaveLength(0);
    });
  });

  describe('sample boxes (development)', () => {
    it('offers the four views, the front cover first and selected', () => {
      const { labels, thumbs } = render(sampleBook, true);
      expect(labels()).toEqual(['כריכה קדמית', 'כריכה אחורית', 'תוכן עניינים', 'עמוד לדוגמה']);
      expect(thumbs()[0].getAttribute('aria-pressed')).toBe('true');
      expect(thumbs()[1].getAttribute('aria-pressed')).toBe('false');
    });

    it('shows the label of the view inside its thumbnail', () => {
      const { thumbs } = render(sampleBook, true);
      expect(thumbs()[1].textContent).toContain('כריכה אחורית');
    });

    it('switches the big picture to a sample box when another view is chosen', () => {
      const { el, pick, thumbs } = render(sampleBook, true);
      pick('כריכה אחורית');
      expect(el.querySelector('.ph')!.textContent).toContain('[כריכה אחורית]');
      expect(el.querySelector('.ph')!.getAttribute('aria-label')).toBe('כריכה אחורית (דוגמה)');
      expect(el.querySelector('oh-book-cover')).toBeNull();
      expect(thumbs()[1].getAttribute('aria-pressed')).toBe('true');
      expect(thumbs()[0].getAttribute('aria-pressed')).toBe('false');
    });

    it('goes back to the drawn cover', () => {
      const { el, pick } = render(sampleBook, true);
      pick('תוכן עניינים');
      pick('כריכה קדמית');
      expect(el.querySelector('oh-book-cover')).toBeTruthy();
    });

    it('groups the thumbnails with a label', () => {
      const { el } = render(sampleBook, true);
      expect(el.querySelector('.thumbs')!.getAttribute('role')).toBe('group');
      expect(el.querySelector('.thumbs')!.getAttribute('aria-label')).toBe('תמונות הספר');
    });
  });

  describe('a book with real pictures', () => {
    const book: Book = { ...sampleBook, images: [image('back'), image('sample')] };

    it('offers only the views it has a picture for, plus the front cover', () => {
      const { labels } = render(book);
      expect(labels()).toEqual(['כריכה קדמית', 'כריכה אחורית', 'עמוד לדוגמה']);
    });

    it('shows the picture of the chosen view, with its alt text', () => {
      const { el, pick } = render(book);
      pick('כריכה אחורית');
      const photo = el.querySelector<HTMLImageElement>('.photo')!;
      expect(photo.getAttribute('src')).toBe('/back.jpg');
      expect(photo.getAttribute('alt')).toBe('תמונה: back');
      expect(el.querySelector('.ph')).toBeNull();
    });

    it('uses a thumbnail picture instead of the label', () => {
      const { thumbs } = render(book);
      expect(thumbs()[1].querySelector('img')!.getAttribute('src')).toBe('/back.jpg');
      expect(thumbs()[1].querySelector('img')!.getAttribute('alt')).toBe('');
    });

    it('describes a picture that has no alt text by its view and the book', () => {
      const noAlt: Book = { ...sampleBook, images: [{ kind: 'back', url: '/b.jpg', alt: '' }] };
      const { el, pick } = render(noAlt);
      pick('כריכה אחורית');
      expect(el.querySelector('.photo')!.getAttribute('alt')).toBe(
        `כריכה אחורית – ${sampleBook.title}`,
      );
    });

    it('prefers a real front picture to the drawn cover', () => {
      const { el } = render({ ...sampleBook, images: [image('front')] });
      expect(el.querySelector('.photo')!.getAttribute('src')).toBe('/front.jpg');
      expect(el.querySelector('oh-book-cover')).toBeNull();
    });
  });

  it('goes back to the front cover when another book is shown', () => {
    const book: Book = { ...sampleBook, images: [image('back')] };
    const { fixture, el, pick } = render(book);
    pick('כריכה אחורית');
    expect(el.querySelector('.photo')).toBeTruthy();

    fixture.componentRef.setInput('book', { ...book, id: 'other', slug: 'other' });
    fixture.detectChanges();
    expect(el.querySelector('oh-book-cover')).toBeTruthy();
    expect(el.querySelector<HTMLButtonElement>('.thumb')!.getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it('marks a sold out book on its front cover only', () => {
    const soldOut: Book = { ...sampleBook, inStock: false, images: [image('back')] };
    const { el, pick } = render(soldOut);
    expect(el.querySelector('.soldout-label')!.textContent).toContain('אזל במלאי');
    pick('כריכה אחורית');
    expect(el.querySelector('.soldout-label')).toBeNull();
  });

  it('shows no label for a book in stock', () => {
    expect(render().el.querySelector('.soldout-label')).toBeNull();
  });
});
