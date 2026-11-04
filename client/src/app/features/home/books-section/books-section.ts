import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-books-section',
  imports: [],
  templateUrl: './books-section.html',
  styleUrl: './books-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BooksSection {}
