import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';

import { Book, BookImage, BookImageKind } from '../../../core/models/book';
import { BookCover } from '../../../shared/book-cover/book-cover';

interface View {
  kind: BookImageKind;
  label: string;
  /** The sample box shown in development when the book has no such picture. */
  placeholder: string;
  image: BookImage | null;
}

const VIEWS: Pick<View, 'kind' | 'label' | 'placeholder'>[] = [
  { kind: 'front', label: 'כריכה קדמית', placeholder: '[כריכה קדמית]' },
  { kind: 'back', label: 'כריכה אחורית', placeholder: '[כריכה אחורית]' },
  { kind: 'contents', label: 'תוכן עניינים', placeholder: '[תוכן עניינים]' },
  { kind: 'sample', label: 'עמוד לדוגמה', placeholder: '[עמוד לדוגמה]' },
];

/**
 * The picture of a book with small pictures under it (front and back cover, contents, a
 * sample page). The front cover is always there: the real image, or the drawn cover.
 * The other views show only if the book has the picture (or, in development, as a sample box).
 */
@Component({
  selector: 'oh-book-gallery',
  imports: [BookCover],
  templateUrl: './book-gallery.html',
  styleUrl: './book-gallery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookGallery {
  readonly book = input.required<Book>();
  /** Show a sample box for a view the book has no picture for (development only). */
  readonly placeholders = input(false);

  /** The picture on show. A new book starts at its front cover. */
  protected readonly selected = linkedSignal<Book, BookImageKind>({
    source: this.book,
    computation: () => 'front',
  });

  protected readonly views = computed<View[]>(() =>
    VIEWS.map((view) => ({
      ...view,
      image: this.book().images?.find((image) => image.kind === view.kind) ?? null,
    })).filter((view) => view.kind === 'front' || view.image || this.placeholders()),
  );

  protected readonly current = computed(
    () => this.views().find((view) => view.kind === this.selected()) ?? this.views()[0],
  );

  protected select(kind: BookImageKind): void {
    this.selected.set(kind);
  }
}
