import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';

const BUMP_MS = 500;

/** Page-level UI state: the side cart, and the short "bump" of the cart button. */
@Injectable({ providedIn: 'root' })
export class UiStore {
  private readonly drawerState = signal(false);
  private readonly bumpState = signal(false);

  readonly drawerOpen = this.drawerState.asReadonly();
  /** True for a moment after an item was added, to animate the cart button. */
  readonly bumping = this.bumpState.asReadonly();

  constructor() {
    // Going to another page closes the side cart.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeDrawer());
  }

  openDrawer(): void {
    this.drawerState.set(true);
  }

  closeDrawer(): void {
    this.drawerState.set(false);
  }

  bump(): void {
    this.bumpState.set(true);
    setTimeout(() => this.bumpState.set(false), BUMP_MS);
  }
}
