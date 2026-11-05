import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { SiteHeader } from './site-header';

@Component({ template: '' })
class Page {}

describe('SiteHeader', () => {
  async function render() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Page },
          { path: 'set', component: Page },
          { path: 'about', component: Page },
          { path: 'contact', component: Page },
          { path: 'cart', component: Page },
        ]),
      ],
    });
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(SiteHeader);
    fixture.detectChanges();
    return { router, fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('has a labelled main navigation with the four links', async () => {
    const { el } = await render();
    const nav = el.querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).toBe('ניווט ראשי');
    const hrefs = Array.from(nav.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/#books', '/set', '/about', '/contact']);
  });

  it('links the logo to the home page with an accessible name', async () => {
    const { el } = await render();
    const logo = el.querySelector('a.logo')!;
    expect(logo.getAttribute('href')).toBe('/');
    expect(logo.getAttribute('aria-label')).toBe('אור ההלכה – לדף הבית');
  });

  it('marks the current page with aria-current', async () => {
    const { router, fixture, el } = await render();
    await router.navigateByUrl('/about');
    fixture.detectChanges();
    const current = el.querySelectorAll('nav a[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0].getAttribute('href')).toBe('/about');
  });

  it('shows the cart count and a matching accessible name', async () => {
    const { el } = await render();
    const cart = el.querySelector('a.cart')!;
    expect(cart.textContent).toContain('עגלה (0)');
    expect(cart.getAttribute('aria-label')).toBe('עגלת קניות, 0 פריטים');
    expect(cart.getAttribute('href')).toBe('/cart');
  });
});
