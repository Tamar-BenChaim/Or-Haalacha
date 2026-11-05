import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { CartStore } from '../../../core/cart/cart-store';
import { CatalogStore } from '../../../core/catalog/catalog-store';
import { matchesQuery } from '../../../core/catalog/search';
import { Book } from '../../../core/models/book';
import { BookCard } from '../../../shared/book-card/book-card';

/**
 * The books list, a section of its own (#books). The nav link "Books" jumps here
 * instantly, with no scrolling animation.
 */
@Component({
  selector: 'oh-books-section',
  imports: [BookCard],
  templateUrl: './books-section.html',
  styleUrl: './books-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BooksSection {
  private readonly catalog = inject(CatalogStore);
  private readonly cart = inject(CartStore);

  protected readonly status = this.catalog.status;
  protected readonly query = signal('');
  protected readonly placeholders = Array.from({ length: 8 }, (_, i) => i);

  protected readonly shown = computed(() =>
    this.catalog.books().filter((book) => matchesQuery(book, this.query())),
  );

  protected readonly countText = computed(() => {
    if (this.status() !== 'ready') {
      return '';
    }
    const total = this.catalog.books().length;
    return this.query().trim() ? `מוצגים ${this.shown().length} מתוך ${total}` : `${total} כרכים`;
  });

  constructor() {
    this.catalog.load();
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected retry(): void {
    this.catalog.retry();
  }

  protected addToCart(book: Book): void {
    this.cart.addItem({ type: 'book', slug: book.slug });
  }
}
