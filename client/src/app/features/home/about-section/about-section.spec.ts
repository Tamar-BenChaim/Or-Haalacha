import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AboutSection } from './about-section';

function render() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(AboutSection);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('AboutSection', () => {
  it('is the #about section with an h2', () => {
    const el = render();
    expect(el.querySelector('section#about')!.getAttribute('aria-labelledby')).toBe('about-title');
    expect(el.querySelector('#about-title')!.tagName).toBe('H2');
    expect(el.querySelector('#about-title')!.textContent).toContain('על הסדרה');
    expect(el.querySelector('h1')).toBeNull();
  });

  it('has a button back to the books', () => {
    const link = render().querySelector('a.btn')!;
    expect(link.textContent).toContain('לכל הספרים');
    expect(link.getAttribute('href')).toBe('/#books');
  });

  it('shows three photos from the lessons, in one row of equal size', () => {
    const el = render();
    expect(el.querySelectorAll('.photos li')).toHaveLength(3);
    expect(el.querySelector('.lessons-title')!.textContent).toContain('מהשיעורים');
  });
});
