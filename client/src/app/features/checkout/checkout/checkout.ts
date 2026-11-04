import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-checkout',
  imports: [],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Checkout {}
