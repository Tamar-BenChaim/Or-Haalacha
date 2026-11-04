import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-field',
  imports: [],
  templateUrl: './field.html',
  styleUrl: './field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Field {}
