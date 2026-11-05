import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Label, projected form control, hint and error message.
 * The control must have `[id]="controlId"`. For accessibility it should also set
 * `aria-describedby` to `<controlId>-hint` / `<controlId>-error` and `aria-invalid`
 * when an error is shown.
 */
@Component({
  selector: 'oh-field',
  templateUrl: './field.html',
  styleUrl: './field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Field {
  readonly controlId = input.required<string>();
  readonly label = input.required<string>();
  readonly required = input(false);
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
}
