import { TestBed } from '@angular/core/testing';

import { HeroTitle } from './hero-title';

function render() {
  const fixture = TestBed.createComponent(HeroTitle);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('HeroTitle', () => {
  it('is decoration only: hidden from screen readers (the real heading is the h1 of the hero)', () => {
    expect(render().getAttribute('aria-hidden')).toBe('true');
  });

  it('is made of text, not a picture: a dark extruded layer under a gold face', () => {
    const el = render();
    expect(el.querySelector('img, svg, canvas')).toBeNull();
    expect(el.querySelector('.ext')!.textContent).toBe('אור ההלכה');
    expect(el.querySelector('.face')!.textContent).toBe('אור ההלכה');
  });

  it('uses the Stam lettering (the --font-stam token)', () => {
    expect(getComputedStyle(render()).fontFamily).toContain('--font-stam');
  });

  it('draws the depth with stacked shadows on the extruded layer', () => {
    const el = render();
    const shadow = getComputedStyle(el.querySelector('.ext')!).textShadow;
    // 16 layers of depth plus the soft shadow under the title.
    expect(shadow.split('rgb').length - 1 + shadow.split('#').length - 1).toBeGreaterThanOrEqual(
      10,
    );
  });

  it('is back at its original size: 15% of the window width, between 64px and 216px', () => {
    render();
    const css = Array.from(document.head.querySelectorAll('style'))
      .map((style) => style.textContent ?? '')
      .filter((text) => text.includes('text-shadow'))
      .join('\n');
    expect(css).toMatch(/clamp\(64px,\s*15vw,\s*216px\)/);
    expect(css).not.toMatch(/cqw/);
  });

  it('never wraps to a second line', () => {
    expect(getComputedStyle(render()).whiteSpace).toBe('nowrap');
  });

  it('fills the face with a gold gradient, cut to the shape of the letters', () => {
    const face = getComputedStyle(render().querySelector('.face')!);
    expect(face.backgroundImage).toContain('linear-gradient');
  });
});
