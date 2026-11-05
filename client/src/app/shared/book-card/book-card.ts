import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Book } from '../../core/models/book';
import { AgorotToShekels } from '../agorot-to-shekels/agorot-to-shekels';
import { BookCover } from '../book-cover/book-cover';

/** A book in a list. Presentational: it only emits `addToCart`. */
@Component({
  selector: 'oh-book-card',
  imports: [RouterLink, BookCover, AgorotToShekels],
  templateUrl: './book-card.html',
  styleUrl: './book-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookCard {
  readonly book = input.required<Book>();
  readonly addToCart = output<Book>();

  protected add(): void {
    const book = this.book();
    if (book.inStock) {
      this.addToCart.emit(book);
    }
  }
}
