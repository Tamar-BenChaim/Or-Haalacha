import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-order-summary',
  imports: [],
  templateUrl: './order-summary.html',
  styleUrl: './order-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderSummary {}
