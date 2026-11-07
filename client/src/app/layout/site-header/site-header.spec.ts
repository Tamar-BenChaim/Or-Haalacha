import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { CartStore } from '../../core/cart/cart-store';
import { ScrollSpy } from '../../core/ui/scroll-spy';
import { UiStore } from '../../core/ui/ui-store';
import { SiteHeader } from './site-header';

@Component({ template: '' })
class Page {}

describe('SiteHeader', () => {
  /** The section the scroll spy reports, which the test controls. */
  const activeSection = signal<string | null>(null);

  async function render() {
    activeSection.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Page },
          { path: 'cart', component: Page },
        ]),
        { provide: ScrollSpy, useValue: { active: activeSection.asReadonly() } },
      ],
    });
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(SiteHeader);
    fixture.detectChanges();
    return { router, fixture, el: fixture.nativeElement as HTMLElement };
  }

  const links = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLAnchorElement>('nav a'));

  it('has a labelled main navigation with a link to each section of the home page', async () => {
    const { el } = await render();
    expect(el.querySelector('nav')!.getAttribute('aria-label')).toBe('ניווט ראשי');
    expect(links(el).map((a) => a.getAttribute('href'))).toEqual([
      '/#books',
      '/#set',
      '/#about',
      '/#contact',
    ]);
    expect(links(el).map((a) => a.textContent!.trim())).toEqual([
      'הספרים',
      'הסט המלא',
      'אודות',
      'צור קשר',
    ]);
  });

  it('links the logo to the home page with an accessible name', async () => {
    const { el } = await render();
    const logo = el.querySelector('a.logo')!;
    expect(logo.getAttribute('href')).toBe('/');
    expect(logo.getAttribute('aria-label')).toBe('אור ההלכה – לדף הבית');
  });

  it('stays at the top of the window while scrolling (the component itself is sticky)', async () => {
    const { fixture } = await render();
    const host = getComputedStyle(fixture.nativeElement as HTMLElement);
    expect(host.position).toBe('sticky');
    expect(host.top).toBe('0px');
    expect(Number(host.zIndex)).toBeGreaterThan(0);
  });

  it('highlights no link while the opening area is on the screen', async () => {
    const { el } = await render();
    expect(el.querySelectorAll('nav a.active')).toHaveLength(0);
    expect(el.querySelectorAll('nav a[aria-current]')).toHaveLength(0);
  });

  it.each([
    ['books', 0],
    ['set', 1],
    ['about', 2],
    ['contact', 3],
  ])('highlights the link of the section on the screen: %s', async (section, index) => {
    const { fixture, el } = await render();
    activeSection.set(section);
    fixture.detectChanges();
    const active = el.querySelectorAll('nav a.active');
    expect(active).toHaveLength(1);
    expect(active[0]).toBe(links(el)[index]);
    expect(active[0].getAttribute('aria-current')).toBe('location');
  });

  it('moves the highlight as the visitor scrolls on', async () => {
    const { fixture, el } = await render();
    activeSection.set('books');
    fixture.detectChanges();
    activeSection.set('set');
    fixture.detectChanges();
    expect(links(el)[0].classList.contains('active')).toBe(false);
    expect(links(el)[1].classList.contains('active')).toBe(true);
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
