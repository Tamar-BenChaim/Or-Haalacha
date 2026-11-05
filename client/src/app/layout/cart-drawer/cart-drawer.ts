import { A11yModule } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartStore, refKey } from '../../core/cart/cart-store';
import { CartItemRef } from '../../core/models/cart';
import { UiStore } from '../../core/ui/ui-store';
import { AgorotToShekels } from '../../shared/agorot-to-shekels/agorot-to-shekels';
import { CartLineRow } from '../../shared/cart-line/cart-line';

/**
 * The side cart. Keyboard users stay inside it (focus trap), Esc closes it, and focus
 * returns to the button that opened it. The page behind it does not scroll while it is open.
 */
@Component({
  selector: 'oh-cart-drawer',
  imports: [A11yModule, RouterLink, CartLineRow, AgorotToShekels],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartDrawer {
  protected readonly ui = inject(UiStore);
  protected readonly cart = inject(CartStore);
  private readonly document = inject(DOCUMENT);

  constructor() {
    effect((onCleanup) => {
      if (!this.ui.drawerOpen()) {
        return;
      }
      // Opening the cart asks the server again for fresh prices and availability.
      untracked(() => this.cart.revalidate());
      const body = this.document.body;
      const previous = body.style.overflow;
      body.style.overflow = 'hidden';
      onCleanup(() => (body.style.overflow = previous));
    });
  }

  protected key(ref: CartItemRef): string {
    return refKey(ref);
  }
}
