import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartStore } from '../../../core/cart/cart-store';
import { BundleStore } from '../../../core/catalog/bundle-store';
import { Seo } from '../../../core/seo/seo';
import { AgorotToShekels } from '../../../shared/agorot-to-shekels/agorot-to-shekels';
import { Breadcrumbs, Crumb } from '../../../shared/breadcrumbs/breadcrumbs';
import { Shelf } from '../shelf/shelf';

/** The full set page (/set): the special price, the shelf of books, and the list of books. */
@Component({
  selector: 'oh-set',
  imports: [RouterLink, AgorotToShekels, Breadcrumbs, Shelf],
  templateUrl: './set.html',
  styleUrl: './set.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetPage {
  private readonly bundles = inject(BundleStore);
  private readonly cart = inject(CartStore);

  protected readonly status = this.bundles.status;
  protected readonly set = this.bundles.fullSet;
  protected readonly crumbs: Crumb[] = [{ label: 'דף הבית', link: '/' }, { label: 'הסט המלא' }];
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
    inject(Seo).set({
      title: 'הסט המלא',
      description: 'כל ספרי סדרת אור ההלכה יחד, במחיר מיוחד.',
    });
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
