import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-cart-drawer',
  imports: [],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartDrawer {}
