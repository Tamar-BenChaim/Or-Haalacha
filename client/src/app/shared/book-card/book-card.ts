import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-book-card',
  imports: [],
  templateUrl: './book-card.html',
  styleUrl: './book-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookCard {}
