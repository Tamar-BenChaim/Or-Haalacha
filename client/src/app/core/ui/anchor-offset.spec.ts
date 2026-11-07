import { DOCUMENT, ViewportScroller } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { provideAnchorOffset } from './anchor-offset';

type Offset = () => [number, number];

/** A made-up page whose header is as tall as the test says (it can change). */
function setup(header: { height: number } | null) {
  let offset: Offset | undefined;
  const viewport = {
    setOffset: vi.fn((value: Offset) => (offset = value)),
  };
  const page = {
    querySelector: (selector: string) =>
      selector === 'header' && header
        ? { getBoundingClientRect: () => ({ height: header.height }) }
        : null,
  };
  TestBed.configureTestingModule({
    providers: [
      { provide: ViewportScroller, useValue: viewport },
      { provide: DOCUMENT, useValue: page },
      provideAnchorOffset(),
    ],
  });
  TestBed.inject(ViewportScroller);
  return { viewport, offset: () => offset!() };
}

describe('provideAnchorOffset', () => {
  it('tells the scroller to stop under the sticky header when it jumps to a section', () => {
    const { viewport } = setup({ height: 94 });
    expect(viewport.setOffset).toHaveBeenCalledTimes(1);
    expect(viewport.setOffset).toHaveBeenCalledWith(expect.any(Function));
  });

  it('uses the height of the header, with nothing to the side', () => {
    expect(setup({ height: 94 }).offset()).toEqual([0, 94]);
  });

  it('reads the height again at every jump, because the header changes (two rows on phones)', () => {
    const header = { height: 94 };
    const { offset } = setup(header);
    expect(offset()).toEqual([0, 94]);
    header.height = 150;
    expect(offset()).toEqual([0, 150]);
  });

  it('is zero when there is no header on the page', () => {
    expect(setup(null).offset()).toEqual([0, 0]);
  });
});

describe('jumping to a section in the real browser scroller', () => {
  it('lands the section below the header by exactly the header height', () => {
    // The real scroller: it scrolls the element to (its position - the offset).
    const scrollTo = vi.fn();
    const sectionTop = 1200; // the section is 1200px from the top of the page
    const section = { getBoundingClientRect: () => ({ left: 0, top: sectionTop }), focus: vi.fn() };
    const fakeWindow = { pageXOffset: 0, pageYOffset: 0, scrollTo };
    const page = {
      getElementById: (id: string) => (id === 'about' ? section : null),
      getElementsByName: () => [],
      querySelector: () => ({ getBoundingClientRect: () => ({ height: 94 }) }),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: page }, provideAnchorOffset()],
    });
    const viewport = TestBed.inject(ViewportScroller);
    // Make this scroller use our window (the default one reads the real window).
    (viewport as unknown as { window: unknown }).window = fakeWindow;
    viewport.scrollToAnchor('about');

    // The page is scrolled to 1200 - 94: the top of the section is at the bottom of the header.
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: 0, top: 1106 }));
  });
});
