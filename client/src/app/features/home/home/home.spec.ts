import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Home } from './home';

describe('Home', () => {
  function render() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('has a single h1 for the site name inside the hero', () => {
    const el = render();
    const h1s = el.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toContain('אור ההלכה');
    expect(el.querySelector('section.hero h1')).toBeTruthy();
  });

  it('keeps the books list as its own section after the hero', () => {
    const el = render();
    const sections = Array.from(el.querySelectorAll('section'));
    expect(sections.map((s) => s.id || s.className)).toEqual(['hero', 'books']);
    expect(el.querySelector('section#books h2')!.textContent).toContain('ספרי הסדרה');
  });

  it('links the hero button to the books section', () => {
    const link = render().querySelector('.hero a.btn')!;
    expect(link.getAttribute('href')).toBe('/#books');
  });
});
