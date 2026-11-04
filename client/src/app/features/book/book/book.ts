import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-book',
  imports: [],
  templateUrl: './book.html',
  styleUrl: './book.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Book {}
