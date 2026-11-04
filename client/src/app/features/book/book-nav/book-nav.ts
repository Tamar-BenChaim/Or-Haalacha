import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-book-nav',
  imports: [],
  templateUrl: './book-nav.html',
  styleUrl: './book-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookNav {}
