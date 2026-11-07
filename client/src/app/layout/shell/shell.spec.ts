import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Shell } from './shell';

@Component({ template: '<h1>דף</h1>' })
class Page {}

/** A home page with sections, like the real one. */
@Component({
  template: `
    <section id="about"><h2>על הסדרה</h2></section>
    <section id="empty"><p>בלי כותרת</p></section>
  `,
})
class Sections {}

describe('Shell', () => {
  function render() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Sections },
          { path: 'cart', component: Page },
        ]),
      ],
    });
    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, router: TestBed.inject(Router) };
  }

  it('has the skip link first, then header, main and footer landmarks', () => {
    const { el } = render();
    const first = el.querySelector('a')!;
    expect(first.classList.contains('skip')).toBe(true);
    expect(first.getAttribute('href')).toBe('#main');
    expect(el.querySelector('header')).toBeTruthy();
    expect(el.querySelector('main#main')).toBeTruthy();
    expect(el.querySelector('footer')).toBeTruthy();
  });

  it('shows no announcement bar by default', () => {
    expect(render().el.querySelector('.bar')).toBeNull();
  });

  it('moves focus to main when the skip link is used', () => {
    const { el } = render();
    el.querySelector<HTMLAnchorElement>('a.skip')!.click();
    expect(document.activeElement).toBe(el.querySelector('main'));
  });

  it('moves focus to main after navigating to another page, but not on the first load', async () => {
    const { el, router } = render();
    const main = el.querySelector('main')!;
    await router.navigateByUrl('/');
    expect(document.activeElement).not.toBe(main);
    await router.navigateByUrl('/cart');
    expect(document.activeElement).toBe(main);
  });

  describe('going to a section of the home page', () => {
    it('moves focus to the heading of the section (not to the whole page)', async () => {
      const { fixture, el, router } = render();
      await router.navigateByUrl('/cart');
      await router.navigateByUrl('/#about');
      fixture.detectChanges();
      const heading = el.querySelector('#about h2')!;
      expect(document.activeElement).toBe(heading);
      expect(heading.getAttribute('tabindex')).toBe('-1');
    });

    it('falls back to main when the section has no heading', async () => {
      const { fixture, el, router } = render();
      await router.navigateByUrl('/cart');
      await router.navigateByUrl('/#empty');
      fixture.detectChanges();
      expect(document.activeElement).toBe(el.querySelector('main'));
    });

    it('falls back to main when there is no such section', async () => {
      const { fixture, el, router } = render();
      await router.navigateByUrl('/cart');
      await router.navigateByUrl('/#nope');
      fixture.detectChanges();
      expect(document.activeElement).toBe(el.querySelector('main'));
    });
  });
});
