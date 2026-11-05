import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** "+" and "−" around a number. Presentational: it only emits the new value. */
@Component({
  selector: 'oh-qty-stepper',
  templateUrl: './qty-stepper.html',
  styleUrl: './qty-stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QtyStepper {
  readonly value = input.required<number>();
  /** The lowest value the "−" button can reach. Use 0 where reaching it removes the item. */
  readonly min = input(1);
  readonly max = input(99);
  readonly label = input('כמות');
  readonly valueChange = output<number>();

  protected change(delta: number): void {
    const next = this.value() + delta;
    if (next >= this.min() && next <= this.max()) {
      this.valueChange.emit(next);
    }
  }
}
