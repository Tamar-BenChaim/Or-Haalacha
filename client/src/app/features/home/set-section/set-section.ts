import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartStore } from '../../../core/cart/cart-store';
import { BundleStore } from '../../../core/catalog/bundle-store';
import { AgorotToShekels } from '../../../shared/agorot-to-shekels/agorot-to-shekels';
import { Shelf } from './shelf/shelf';

/** The full set (#set): the special price, the shelf of books and the list of books. */
@Component({
  selector: 'oh-set-section',
  imports: [RouterLink, AgorotToShekels, Shelf],
  templateUrl: './set-section.html',
  styleUrl: './set-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetSection {
  private readonly bundles = inject(BundleStore);
  private readonly cart = inject(CartStore);

  protected readonly status = this.bundles.status;
  protected readonly set = this.bundles.fullSet;
  /** Remembered by the book page, to show the way back in its breadcrumbs. */
  protected readonly from = { from: 'set' };

  /** How much is saved against buying the books one by one. Null when it cannot be told. */
  protected readonly saving = computed(() => {
    const set = this.set();
    if (!set || set.separatePriceAgorot === null || set.separatePriceAgorot <= set.priceAgorot) {
      return null;
    }
    return set.separatePriceAgorot - set.priceAgorot;
  });

  constructor() {
    this.bundles.load();
  }

  protected add(): void {
    const set = this.set();
    if (set?.inStock) {
      this.cart.addItem({ type: 'bundle', slug: set.slug });
    }
  }

  protected retry(): void {
    this.bundles.retry();
  }
}
