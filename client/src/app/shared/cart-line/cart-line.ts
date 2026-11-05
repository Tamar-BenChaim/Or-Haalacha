import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartItemView } from '../../core/models/cart';
import { AgorotToShekels } from '../agorot-to-shekels/agorot-to-shekels';
import { QtyStepper } from '../qty-stepper/qty-stepper';

/** One cart line (used by the side cart and the cart page). Presentational. */
@Component({
  selector: 'oh-cart-line',
  imports: [RouterLink, QtyStepper, AgorotToShekels],
  templateUrl: './cart-line.html',
  styleUrl: './cart-line.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartLineRow {
  readonly item = input.required<CartItemView>();
  readonly quantityChange = output<number>();
  readonly removed = output<void>();

  /** Where the title links to: the book page, or the set page. */
  protected readonly link = computed(() => {
    const ref = this.item().line.ref;
    return ref.type === 'bundle' ? ['/set'] : ['/book', ref.slug];
  });

  protected readonly title = computed(() => {
    const item = this.item();
    if (item.title) {
      return item.title;
    }
    return item.status === 'unavailable' ? 'פריט שאינו זמין' : 'טוען פריט…';
  });
}
