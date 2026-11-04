import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-book-cover',
  imports: [],
  templateUrl: './book-cover.html',
  styleUrl: './book-cover.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookCover {}
