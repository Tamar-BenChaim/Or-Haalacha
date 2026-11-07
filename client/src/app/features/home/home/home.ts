import { ViewportScroller } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  Injector,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';

import { BundleStore } from '../../../core/catalog/bundle-store';
import { CatalogStore } from '../../../core/catalog/catalog-store';
import { HOME_SECTIONS, ScrollSpy } from '../../../core/ui/scroll-spy';
import { AboutSection } from '../about-section/about-section';
import { BooksSection } from '../books-section/books-section';
import { ContactSection } from '../contact-section/contact-section';
import { Hero } from '../hero/hero';
import { SetSection } from '../set-section/set-section';

const settled = (status: string) => status === 'ready' || status === 'error';

/**
 * The home page is one long page: the opening area, then the sections books, set,
 * about and contact. The header links jump to the sections, and the link of the
 * section on the screen is highlighted (see ScrollSpy).
 */
@Component({
  selector: 'oh-home',
  imports: [Hero, BooksSection, SetSection, AboutSection, ContactSection],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  constructor() {
    const spy = inject(ScrollSpy);
    afterNextRender(() => spy.start(HOME_SECTIONS));
    inject(DestroyRef).onDestroy(() => spy.halt());

    // The books and the set load after the page is shown and make it taller. If the visitor
    // arrived at a section lower on the page (for example #contact from another page), jump
    // there again once the content above it has its final height.
    const catalog = inject(CatalogStore);
    const bundles = inject(BundleStore);
    const router = inject(Router);
    const viewport = inject(ViewportScroller);
    const injector = inject(Injector);
    let done = false;
    effect(() => {
      if (done || !settled(catalog.status()) || !settled(bundles.status())) {
        return;
      }
      done = true;
      untracked(() => {
        const fragment = router.parseUrl(router.url).fragment;
        if (fragment) {
          afterNextRender(() => viewport.scrollToAnchor(fragment), { injector });
        }
      });
    });
  }
}
