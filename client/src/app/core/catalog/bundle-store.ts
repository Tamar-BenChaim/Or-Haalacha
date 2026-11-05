import { computed, inject, Injectable, signal } from '@angular/core';

import { Bundle } from '../models/book';
import { BUNDLES_SOURCE } from './bundles-source';
import { CatalogStatus } from './catalog-store';

/** The full set (and any other bundle), loaded once and shared by every page. */
@Injectable({ providedIn: 'root' })
export class BundleStore {
  private readonly source = inject(BUNDLES_SOURCE);
  private readonly bundlesState = signal<Bundle[]>([]);
  private readonly statusState = signal<CatalogStatus>('idle');

  readonly bundles = this.bundlesState.asReadonly();
  readonly status = this.statusState.asReadonly();

  /** The full set: the bundle called "full-set", or the first one. */
  readonly fullSet = computed(
    () =>
      this.bundlesState().find((bundle) => bundle.slug === 'full-set') ??
      this.bundlesState()[0] ??
      null,
  );

  load(): void {
    if (this.statusState() === 'loading' || this.statusState() === 'ready') {
      return;
    }
    this.statusState.set('loading');
    this.source.list().subscribe({
      next: (bundles) => {
        this.bundlesState.set(bundles);
        this.statusState.set('ready');
      },
      error: () => this.statusState.set('error'),
    });
  }

  retry(): void {
    this.statusState.set('idle');
    this.load();
  }
}
