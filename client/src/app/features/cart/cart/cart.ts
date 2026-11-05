import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { CartStore, refKey } from '../../../core/cart/cart-store';
import { CartItemRef } from '../../../core/models/cart';
import { AgorotToShekels } from '../../../shared/agorot-to-shekels/agorot-to-shekels';
import { CartLineRow } from '../../../shared/cart-line/cart-line';

/** The full cart page (/cart), laid out like the design mockup. Prices come from the server. */
@Component({
  selector: 'oh-cart',
  imports: [RouterLink, CartLineRow, AgorotToShekels],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cart {
  protected readonly cart = inject(CartStore);
  protected readonly showCoupon = environment.showCoupon;
  protected readonly couponMessage = signal('');

  constructor() {
    this.cart.revalidate();
  }

  protected key(ref: CartItemRef): string {
    return refKey(ref);
  }

  /** Coupons are not supported yet. The field is shown so the design can be reviewed. */
  protected applyCoupon(): void {
    this.couponMessage.set('קודי קופון עדיין לא נתמכים.');
  }
}
