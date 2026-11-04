import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-cart',
  imports: [],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cart {}
