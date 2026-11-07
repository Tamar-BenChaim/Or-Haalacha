import { DOCUMENT, ViewportScroller } from '@angular/common';
import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';

/**
 * A jump to a section (/#about) stops right below the sticky header, and not behind it.
 * Angular scrolls the section to the top of the window itself and ignores the CSS
 * `scroll-margin`, so it is told how tall the header is. The height is read at the moment of
 * the jump, because it changes (two rows on phones). The space above the section title comes
 * from the section's own top padding (`--section-top`).
 */
export function provideAnchorOffset(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const viewport = inject(ViewportScroller);
    const document = inject(DOCUMENT);
    viewport.setOffset(() => [
      0,
      document.querySelector('header')?.getBoundingClientRect().height ?? 0,
    ]);
  });
}
