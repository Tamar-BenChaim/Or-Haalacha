import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, map, of, switchMap, tap } from 'rxjs';

import { CartStore } from '../../../core/cart/cart-store';
import { BOOKS_SOURCE } from '../../../core/catalog/books-source';
import { CatalogStore } from '../../../core/catalog/catalog-store';
import { Book } from '../../../core/models/book';
import { Seo } from '../../../core/seo/seo';
import { Share } from '../../../core/seo/share';
import { AgorotToShekels } from '../../../shared/agorot-to-shekels/agorot-to-shekels';
import { BookCard } from '../../../shared/book-card/book-card';
import { BookCover } from '../../../shared/book-cover/book-cover';
import { Breadcrumbs, Crumb } from '../../../shared/breadcrumbs/breadcrumbs';
import { QtyStepper } from '../../../shared/qty-stepper/qty-stepper';

interface BookState {
  status: 'loading' | 'ready' | 'notfound' | 'error';
  book: Book | null;
}

const ORIGINS: Record<string, Crumb> = {
  cart: { label: 'עגלת הקניות', link: '/cart' },
  set: { label: 'הסט המלא', link: '/set' },
};
const HOME: Crumb = { label: 'דף הבית', link: '/' };

/** A single book (/book/:slug): details, buy, share, neighbors in the series and related books. */
@Component({
  selector: 'oh-book',
  imports: [RouterLink, AgorotToShekels, BookCard, BookCover, Breadcrumbs, QtyStepper],
  templateUrl: './book.html',
  styleUrl: './book.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly source = inject(BOOKS_SOURCE);
  private readonly catalog = inject(CatalogStore);
  private readonly cart = inject(CartStore);
  private readonly seo = inject(Seo);
  private readonly sharer = inject(Share);
  private readonly retryTick = new BehaviorSubject(0);

  protected readonly state = signal<BookState>({ status: 'loading', book: null });
  protected readonly quantity = signal(1);
  protected readonly copied = signal(false);
  /** Where the visitor came from ("cart", "set"), for the breadcrumbs. Anything else is the home page. */
  private readonly origin = signal<string | null>(null);

  protected readonly crumbs = computed<Crumb[]>(() => [
    (this.origin() && ORIGINS[this.origin()!]) || HOME,
    { label: this.state().book?.title ?? '' },
  ]);

  /** The previous and next volume. After the last one comes the first (a circle). */
  protected readonly neighbors = computed(() => {
    const books = this.catalog.books();
    const index = books.findIndex((book) => book.slug === this.state().book?.slug);
    if (index < 0 || books.length < 2) {
      return null;
    }
    return {
      previous: books[(index - 1 + books.length) % books.length],
      next: books[(index + 1) % books.length],
    };
  });

  /** Up to four other books, the ones that follow this one in the series. */
  protected readonly related = computed(() => {
    const books = this.catalog.books();
    const index = books.findIndex((book) => book.slug === this.state().book?.slug);
    if (index < 0) {
      return books.slice(0, 4);
    }
    const others = [...books.slice(index + 1), ...books.slice(0, index)];
    return others.slice(0, 4);
  });

  constructor() {
    this.catalog.load();
    combineLatest([this.route.paramMap, this.retryTick])
      .pipe(
        map(([params]) => params.get('slug') ?? ''),
        tap(() => {
          this.state.set({ status: 'loading', book: null });
          this.quantity.set(1);
          this.copied.set(false);
          const from = this.router.getCurrentNavigation()?.extras.state?.['from'];
          this.origin.set(typeof from === 'string' ? from : null);
        }),
        switchMap((slug) =>
          this.source.get(slug).pipe(
            map((book): BookState => ({ status: 'ready', book })),
            catchError((error: { status?: number }) =>
              of<BookState>({ status: error?.status === 404 ? 'notfound' : 'error', book: null }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => {
        this.state.set(state);
        this.seo.set(
          state.book
            ? { title: state.book.title, description: state.book.shortDescription }
            : { title: 'הספר לא נמצא' },
        );
      });
  }

  protected add(book: Book): void {
    if (book.inStock) {
      this.cart.addItem({ type: 'book', slug: book.slug }, this.quantity());
    }
  }

  protected addFromCard(book: Book): void {
    this.cart.addItem({ type: 'book', slug: book.slug });
  }

  protected async share(book: Book): Promise<void> {
    const result = await this.sharer.share({ url: window.location.href, title: book.title });
    if (result === 'copied') {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 3000);
    }
  }

  protected retry(): void {
    this.retryTick.next(this.retryTick.value + 1);
  }
}
