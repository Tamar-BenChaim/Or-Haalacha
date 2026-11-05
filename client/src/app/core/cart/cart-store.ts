import { Injectable, signal } from '@angular/core';

/** Cart state. Only the item count exists for now; the logic comes with the cart feature. */
@Injectable({ providedIn: 'root' })
export class CartStore {
  /** Total quantity of items in the cart. */
  readonly count = signal(0).asReadonly();
}
