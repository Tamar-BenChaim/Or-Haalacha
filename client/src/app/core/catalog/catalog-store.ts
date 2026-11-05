import { inject, Injectable, signal } from '@angular/core';

import { Book } from '../models/book';
import { BOOKS_SOURCE } from './books-source';

export type CatalogStatus = 'idle' | 'loading' | 'ready' | 'error';

/** The books, loaded once and shared by every page. */
@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private readonly source = inject(BOOKS_SOURCE);
  private readonly booksState = signal<Book[]>([]);
  private readonly statusState = signal<CatalogStatus>('idle');

  readonly books = this.booksState.asReadonly();
  readonly status = this.statusState.asReadonly();

  /** Loads the books once. Calling it again while loading or after success does nothing. */
  load(): void {
    if (this.statusState() === 'loading' || this.statusState() === 'ready') {
      return;
    }
    this.statusState.set('loading');
    this.source.list().subscribe({
      next: (books) => {
        this.booksState.set(books);
        this.statusState.set('ready');
      },
      error: () => this.statusState.set('error'),
    });
  }

  /** Tries again after an error. */
  retry(): void {
    this.statusState.set('idle');
    this.load();
  }
}
