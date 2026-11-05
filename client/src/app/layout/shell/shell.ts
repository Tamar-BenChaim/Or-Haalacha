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

  constructor() {
    // After every navigation (except the first load and in-page anchors) move focus
    // to <main>, so keyboard and screen reader users start at the new page content.
    inject(Router)
      .events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        skip(1),
        filter((event) => !event.urlAfterRedirects.includes('#')),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.main().nativeElement.focus({ preventScroll: true }));
  }

  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }
}
