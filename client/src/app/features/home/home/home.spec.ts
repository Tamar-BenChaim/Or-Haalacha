import { ViewportScroller } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NEVER, of } from 'rxjs';

import { CART_QUOTE_SOURCE } from '../../../core/cart/cart-quote-source';
import { BOOKS_SOURCE } from '../../../core/catalog/books-source';
import { BUNDLES_SOURCE } from '../../../core/catalog/bundles-source';
import { HOME_SECTIONS, ScrollSpy } from '../../../core/ui/scroll-spy';
import { Home } from './home';

@Component({ template: '' })
class Empty {}

interface Options {
  books?: unknown;
}

function configure(options: Options = {}) {
  const spy = { active: signal<string | null>(null).asReadonly(), start: vi.fn(), halt: vi.fn() };
  const viewport = { scrollToAnchor: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', component: Empty }]),
      { provide: ScrollSpy, useValue: spy },
      { provide: ViewportScroller, useValue: viewport },
      { provide: BOOKS_SOURCE, useValue: { list: () => options.books ?? of([]) } },
      { provide: BUNDLES_SOURCE, useValue: { list: () => of([]) } },
      { provide: CART_QUOTE_SOURCE, useValue: { quote: () => NEVER } },
    ],
  });
  return { spy, viewport };
}

function create() {
  const fixture = TestBed.createComponent(Home);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

function setup(options: Options = {}) {
  return { ...configure(options), ...create() };
}

describe('Home', () => {
  it('has a single h1 for the site name inside the hero', () => {
    const { el } = setup();
    const h1s = el.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toContain('אור ההלכה');
    expect(el.querySelector('section.hero h1')).toBeTruthy();
  });

  it('is one page: the hero first, then the sections books, set, about and contact', () => {
    const { el } = setup();
    const sections = Array.from(el.querySelectorAll('section'));
    expect(sections.map((s) => s.id || s.className)).toEqual([
      'hero',
      'books',
      'set',
      'about',
      'contact',
    ]);
  });

  it('gives every section its own heading, linked with aria-labelledby', () => {
    const { el } = setup();
    for (const id of HOME_SECTIONS) {
      const section = el.querySelector(`section#${id}`)!;
      const heading = el.querySelector(`#${section.getAttribute('aria-labelledby')}`)!;
      expect(heading, id).toBeTruthy();
      expect(heading.tagName, id).toBe('H2');
    }
  });

  it('links the hero buttons to the books and the set sections', () => {
    const { el } = setup();
    const hrefs = Array.from(el.querySelectorAll('.hero a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/#books', '/#set']);
  });

  describe('highlighting the header link', () => {
    it('starts following the scroll after the page is shown, with the sections in order', async () => {
      const { fixture, spy } = setup();
      await fixture.whenStable();
      expect(spy.start).toHaveBeenCalledWith(HOME_SECTIONS);
    });

    it('stops following the scroll when the visitor leaves the page', () => {
      const { fixture, spy } = setup();
      fixture.destroy();
      expect(spy.halt).toHaveBeenCalled();
    });
  });

  describe('arriving at a section lower on the page', () => {
    async function openAt(url: string, options: Options = {}) {
      const config = configure(options);
      await TestBed.inject(Router).navigateByUrl(url);
      const { fixture } = create();
      await fixture.whenStable();
      return config;
    }

    it('jumps there again once the books and the set have loaded and changed the page height', async () => {
      const { viewport } = await openAt('/#contact');
      expect(viewport.scrollToAnchor).toHaveBeenCalledWith('contact');
    });

    it('waits while the content above is still loading', async () => {
      const { viewport } = await openAt('/#contact', { books: NEVER });
      expect(viewport.scrollToAnchor).not.toHaveBeenCalled();
    });

    it('does nothing when there is no section in the address', async () => {
      const { viewport } = await openAt('/');
      expect(viewport.scrollToAnchor).not.toHaveBeenCalled();
    });
  });
});
