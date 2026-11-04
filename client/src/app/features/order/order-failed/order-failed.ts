import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-order-failed',
  imports: [],
  templateUrl: './order-failed.html',
  styleUrl: './order-failed.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderFailed {}
