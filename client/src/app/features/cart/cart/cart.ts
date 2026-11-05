import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartStore, refKey } from '../../../core/cart/cart-store';
import { CartItemRef } from '../../../core/models/cart';
import { AgorotToShekels } from '../../../shared/agorot-to-shekels/agorot-to-shekels';
import { CartLineRow } from '../../../shared/cart-line/cart-line';

/** The full cart page (/cart). Prices come from the server each time the page opens. */
@Component({
  selector: 'oh-cart',
  imports: [RouterLink, CartLineRow, AgorotToShekels],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cart {
  protected readonly cart = inject(CartStore);

  constructor() {
    this.cart.revalidate();
  }

  protected key(ref: CartItemRef): string {
    return refKey(ref);
  }
}
