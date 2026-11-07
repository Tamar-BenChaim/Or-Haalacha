import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, map, of, switchMap, tap } from 'rxjs';

import { CartStore } from '../../../core/cart/cart-store';
import { SHOW_CONTENT_PLACEHOLDERS } from '../../../core/config/content-placeholders';
import { BOOKS_SOURCE } from '../../../core/catalog/books-source';
import { CatalogStore } from '../../../core/catalog/catalog-store';
import { Book, BookImage } from '../../../core/models/book';
import { Seo } from '../../../core/seo/seo';
import { Share } from '../../../core/seo/share';
import { AgorotToShekels } from '../../../shared/agorot-to-shekels/agorot-to-shekels';
import { BookCard } from '../../../shared/book-card/book-card';
import { Breadcrumbs, Crumb } from '../../../shared/breadcrumbs/breadcrumbs';
import { QtyStepper } from '../../../shared/qty-stepper/qty-stepper';
import { BookGallery } from '../book-gallery/book-gallery';

interface BookState {
  status: 'loading' | 'ready' | 'notfound' | 'error';
  book: Book | null;
}

/** One page of the "look inside" preview: a real picture, or a sample box in development. */
interface PreviewPage {
  label: string;
  image: BookImage | null;
}

const ORIGINS: Record<string, Crumb> = {
  cart: { label: 'עגלת הקניות', link: '/cart' },
  set: { label: 'הסט המלא', link: '/', fragment: 'set' },
};
const HOME: Crumb = { label: 'דף הבית', link: '/' };
const PREVIEW_SAMPLES = ['תוכן עניינים', 'עמוד א׳', 'עמוד ב׳'];
const MISSING = '[—]';

/**
 * A single book (/book/:slug), laid out like the design mockup: pictures, details and buying,
 * share, about the book with a look inside, technical details, previous / next volume and
 * related books.
 */
@Component({
  selector: 'oh-book',
  imports: [RouterLink, AgorotToShekels, BookCard, BookGallery, Breadcrumbs, QtyStepper],
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

  /** Sample boxes for content the book does not have yet (development only). */
  protected readonly placeholders = inject(SHOW_CONTENT_PLACEHOLDERS);

  protected readonly state = signal<BookState>({ status: 'loading', book: null });
  protected readonly quantity = signal(1);
  protected readonly copied = signal(false);
  protected readonly previewOpen = signal(false);
  /** Where the visitor came from ("cart", "set"), for the breadcrumbs. Anything else is the home page. */
  private readonly origin = signal<string | null>(null);

  protected readonly crumbs = computed<Crumb[]>(() => [
    (this.origin() && ORIGINS[this.origin()!]) || HOME,
    { label: this.state().book?.title ?? '' },
  ]);

  /** The pages of "look inside": the contents and sample pages the book has. */
  protected readonly previewPages = computed<PreviewPage[]>(() => {
    const images = (this.state().book?.images ?? []).filter(
      (image) => image.kind === 'contents' || image.kind === 'sample',
    );
    if (images.length > 0) {
      return images.map((image, index) => ({ label: `עמוד לדוגמה ${index + 1}`, image }));
    }
    return this.placeholders ? PREVIEW_SAMPLES.map((label) => ({ label, image: null })) : [];
  });

  /** The rows of the details table. Without a value a row shows only in development ("[—]"). */
  protected readonly detailRows = computed(() => {
    const details = this.state().book?.details;
    const rows = [
      { label: 'מספר עמודים', value: details?.pages },
      { label: 'גודל', value: details?.size },
      { label: 'כריכה', value: details?.binding },
      { label: 'שנת הוצאה', value: details?.year },
    ];
    return rows
      .map((row) => ({
        label: row.label,
        value:
          row.value === null || row.value === undefined || row.value === ''
            ? null
            : String(row.value),
      }))
      .filter((row) => row.value !== null || this.placeholders)
      .map((row) => ({ label: row.label, value: row.value ?? MISSING }));
  });

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
          this.previewOpen.set(false);
          const from = this.router.currentNavigation()?.extras.state?.['from'];
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

  protected togglePreview(): void {
    this.previewOpen.update((open) => !open);
  }

  protected retry(): void {
    this.retryTick.next(this.retryTick.value + 1);
  }
}
