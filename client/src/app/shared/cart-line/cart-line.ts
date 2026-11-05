import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartItemView } from '../../core/models/cart';
import { AgorotToShekels } from '../agorot-to-shekels/agorot-to-shekels';
import { BookCover } from '../book-cover/book-cover';
import { QtyStepper } from '../qty-stepper/qty-stepper';

/** One cart line (used by the side cart and the cart page). Presentational. */
@Component({
  selector: 'oh-cart-line',
  imports: [RouterLink, BookCover, QtyStepper, AgorotToShekels],
  templateUrl: './cart-line.html',
  styleUrl: './cart-line.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartLineRow {
  readonly item = input.required<CartItemView>();
  /** The small cover before the title (shown on the cart page, not in the side cart). */
  readonly showCover = input(false);
  readonly quantityChange = output<number>();
  readonly removed = output<void>();

  /** Remembered by the book page, to show the way back to the cart in its breadcrumbs. */
  protected readonly from = { from: 'cart' };

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
