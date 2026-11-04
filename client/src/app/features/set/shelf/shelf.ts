import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-shelf',
  imports: [],
  templateUrl: './shelf.html',
  styleUrl: './shelf.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shelf {}
