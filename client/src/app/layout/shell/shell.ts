import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';

import { SiteSettingsStore } from '../../core/settings/site-settings-store';
import { AnnouncementBar } from '../announcement-bar/announcement-bar';
import { CartDrawer } from '../cart-drawer/cart-drawer';
import { SiteFooter } from '../site-footer/site-footer';
import { SiteHeader } from '../site-header/site-header';

@Component({
  selector: 'oh-shell',
  imports: [RouterOutlet, AnnouncementBar, SiteHeader, SiteFooter, CartDrawer],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  protected readonly announcement = inject(SiteSettingsStore).announcement;
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  constructor() {
    // After every navigation except the first load, move focus: to the heading of the
    // section when the address points at one (/#about), otherwise to <main>. Keyboard and
    // screen reader users then start where the content they asked for begins.
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        skip(1),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        const fragment = this.router.parseUrl(event.urlAfterRedirects).fragment;
        if (!fragment || !this.focusSectionHeading(fragment)) {
          this.main().nativeElement.focus({ preventScroll: true });
        }
      });
  }

  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }

  /** Returns false when there is no such section or it has no heading. */
  private focusSectionHeading(id: string): boolean {
    const heading = this.document.getElementById(id)?.querySelector<HTMLElement>('h1, h2');
    if (!heading) {
      return false;
    }
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    return true;
  }
}
