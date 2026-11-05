import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { CartStore } from '../../core/cart/cart-store';
import { UiStore } from '../../core/ui/ui-store';
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

  it('highlights "Books" only when the URL points at #books', async () => {
    const { router, fixture, el } = await render();
    const books = el.querySelector<HTMLAnchorElement>('nav a[href="/#books"]')!;

    await router.navigateByUrl('/');
    fixture.detectChanges();
    expect(books.classList.contains('active')).toBe(false);

    await router.navigateByUrl('/#books');
    fixture.detectChanges();
    expect(books.classList.contains('active')).toBe(true);
    expect(books.getAttribute('aria-current')).toBe('location');

    await router.navigateByUrl('/about');
    fixture.detectChanges();
    expect(books.classList.contains('active')).toBe(false);
  });

  it('shows the cart count and a matching accessible name', async () => {
    const { el } = await render();
    const cart = el.querySelector('a.cart')!;
    expect(cart.textContent).toContain('עגלה (0)');
    expect(cart.getAttribute('aria-label')).toBe('עגלת קניות, 0 פריטים');
  });

  it('updates the count when items are added', async () => {
    const { fixture, el } = await render();
    TestBed.inject(CartStore).addItem({ type: 'book', slug: 'a' }, 3);
    fixture.detectChanges();
    const cart = el.querySelector('a.cart')!;
    expect(cart.textContent).toContain('עגלה (3)');
    expect(cart.getAttribute('aria-label')).toBe('עגלת קניות, 3 פריטים');
  });

  it('goes to the full cart page, and does not open the side cart', async () => {
    const { fixture, el } = await render();
    const ui = TestBed.inject(UiStore);
    TestBed.inject(CartStore).addItem({ type: 'book', slug: 'a' });
    ui.closeDrawer();
    fixture.detectChanges();
    const cart = el.querySelector<HTMLAnchorElement>('a.cart')!;
    expect(cart.getAttribute('href')).toBe('/cart');
    cart.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/cart');
    expect(ui.drawerOpen()).toBe(false);
  });
});
