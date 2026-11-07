import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { HOME_SECTIONS, ScrollSpy } from './scroll-spy';

/**
 * A made-up document and window, so these tests never touch the real page (other test
 * files use it too). It has a sticky header 100px tall and the home page sections.
 */
function createFakePage(sections: readonly string[] = HOME_SECTIONS) {
  const listeners = new Map<string, Set<() => void>>();
  const frames: (() => void)[] = [];

  /** Where the top of each section is, measured from the top of the window. */
  const tops: Record<string, number> = {};
  const view = {
    scrollY: 0,
    innerHeight: 800,
    addEventListener: vi.fn((type: string, listener: () => void) => {
      listeners.set(type, (listeners.get(type) ?? new Set()).add(listener));
    }),
    removeEventListener: vi.fn((type: string, listener: () => void) => {
      listeners.get(type)?.delete(listener);
    }),
    requestAnimationFrame: vi.fn((callback: () => void) => frames.push(callback)),
    cancelAnimationFrame: vi.fn(),
  };
  const root = { scrollHeight: 4000 };
  const page = {
    defaultView: view,
    documentElement: root,
    querySelector: (selector: string) =>
      selector === 'header' ? { getBoundingClientRect: () => ({ height: 100 }) } : null,
    getElementById: (id: string) =>
      sections.includes(id) ? { getBoundingClientRect: () => ({ top: tops[id] ?? 9999 }) } : null,
  };

  return {
    page,
    tops,
    view,
    root,
    /** The visitor scrolls: the browser tells us, and the next animation frame runs. */
    scroll: () => {
      listeners.get('scroll')?.forEach((listener) => listener());
      frames.splice(0).forEach((frame) => frame());
    },
    /** How many scroll listeners are attached right now. */
    scrollListeners: () => listeners.get('scroll')?.size ?? 0,
  };
}

function setup(sections?: readonly string[]) {
  const fake = createFakePage(sections);
  TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: fake.page }] });
  return { ...fake, spy: TestBed.inject(ScrollSpy) };
}

describe('ScrollSpy', () => {
  it('has no active section at the top of the page (the opening area)', () => {
    const { spy, tops } = setup();
    Object.assign(tops, { books: 700, set: 1500, about: 2300, contact: 3000 });
    spy.start(HOME_SECTIONS);
    expect(spy.active()).toBeNull();
  });

  it('follows the scroll: the last section whose top passed the header is active', () => {
    const { spy, tops, scroll, view } = setup();
    spy.start(HOME_SECTIONS);

    Object.assign(tops, { books: 112, set: 900, about: 1700, contact: 2500 });
    view.scrollY = 600;
    scroll();
    expect(spy.active()).toBe('books');

    Object.assign(tops, { books: -700, set: 112, about: 900, contact: 1700 });
    scroll();
    expect(spy.active()).toBe('set');

    Object.assign(tops, { books: -1500, set: -700, about: -100, contact: 700 });
    scroll();
    expect(spy.active()).toBe('about');
  });

  it('makes a section active as soon as it gets near the header, not only once it is under it', () => {
    const { spy, tops, scroll } = setup();
    spy.start(HOME_SECTIONS);
    // The header is 100px tall: a section 140px from the top is within the 48px margin.
    Object.assign(tops, { books: 140, set: 900, about: 1700, contact: 2500 });
    scroll();
    expect(spy.active()).toBe('books');

    Object.assign(tops, { books: 160, set: 900, about: 1700, contact: 2500 });
    scroll();
    expect(spy.active()).toBeNull();
  });

  it('makes the last section active at the very bottom, even if it is short', () => {
    const { spy, tops, scroll, view } = setup();
    spy.start(HOME_SECTIONS);
    Object.assign(tops, { books: -2000, set: -1200, about: -400, contact: 650 });
    view.scrollY = 3200; // 3200 + 800 = 4000 = the whole page
    scroll();
    expect(spy.active()).toBe('contact');
  });

  it('does not treat a page that fits on the screen as "at the bottom"', () => {
    const { spy, tops, scroll, root } = setup();
    spy.start(HOME_SECTIONS);
    root.scrollHeight = 800; // nothing to scroll
    Object.assign(tops, { books: 700, set: 1500, about: 2300, contact: 3000 });
    scroll();
    expect(spy.active()).toBeNull();
  });

  it('goes back to nothing when the visitor scrolls to the top again', () => {
    const { spy, tops, scroll, view } = setup();
    spy.start(HOME_SECTIONS);
    Object.assign(tops, { books: 112, set: 900, about: 1700, contact: 2500 });
    view.scrollY = 600;
    scroll();
    Object.assign(tops, { books: 700, set: 1500, about: 2300, contact: 3000 });
    view.scrollY = 0;
    scroll();
    expect(spy.active()).toBeNull();
  });

  it('skips a section that is not on the page', () => {
    const { spy, tops, scroll } = setup(['books', 'about', 'contact']);
    spy.start(HOME_SECTIONS);
    Object.assign(tops, { books: -700, about: 112, contact: 900 });
    scroll();
    expect(spy.active()).toBe('about');
  });

  it('works out the section at most once per animation frame, however many scroll events come', () => {
    const { spy, view, scroll, tops } = setup();
    spy.start(HOME_SECTIONS);
    Object.assign(tops, { books: 112 });
    view.requestAnimationFrame.mockClear();
    // Many events before the frame runs: only one frame is requested.
    for (let i = 0; i < 5; i++) {
      for (const [, listener] of view.addEventListener.mock.calls.filter(([t]) => t === 'scroll')) {
        listener();
      }
    }
    expect(view.requestAnimationFrame).toHaveBeenCalledTimes(1);
    scroll();
    expect(spy.active()).toBe('books');
  });

  it('stops listening, and forgets the section, when halted', () => {
    const { spy, tops, scroll, scrollListeners } = setup();
    spy.start(HOME_SECTIONS);
    Object.assign(tops, { books: 112, set: 900, about: 1700, contact: 2500 });
    scroll();
    expect(spy.active()).toBe('books');

    spy.halt();
    expect(spy.active()).toBeNull();
    expect(scrollListeners()).toBe(0);
    Object.assign(tops, { books: -700, set: 112, about: 900, contact: 1700 });
    scroll();
    expect(spy.active()).toBeNull();
  });

  it('can be started again without listening twice', () => {
    const { spy, scrollListeners } = setup();
    spy.start(HOME_SECTIONS);
    spy.start(HOME_SECTIONS);
    expect(scrollListeners()).toBe(1);
  });

  it('does nothing when there is no window (server side)', () => {
    const { spy, page } = setup();
    (page as { defaultView: unknown }).defaultView = null;
    expect(() => spy.start(HOME_SECTIONS)).not.toThrow();
    expect(spy.active()).toBeNull();
  });
});
