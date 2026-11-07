import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Book } from '../../../../core/models/book';
import { AgorotToShekels } from '../../../../shared/agorot-to-shekels/agorot-to-shekels';

const DEFAULT_CAPTION = 'מעבר על ספר במדף מציג את שמו. לחיצה פותחת את דף הספר.';

/** The books standing on a shelf. Hovering or focusing a spine shows the name and price. */
@Component({
  selector: 'oh-shelf',
  imports: [RouterLink, AgorotToShekels],
  templateUrl: './shelf.html',
  styleUrl: './shelf.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shelf {
  readonly books = input.required<Book[]>();

  /** The book whose spine is hovered or focused. */
  protected readonly active = signal<Book | null>(null);
  protected readonly defaultCaption = DEFAULT_CAPTION;

  /** Spines are a little different in height, like real books (86%–100%). */
  protected readonly spines = computed(() =>
    this.books().map((book, index) => ({ book, height: 86 + ((index * 7) % 15) })),
  );

  protected show(book: Book): void {
    this.active.set(book);
  }

  protected clear(): void {
    this.active.set(null);
  }

  /** What opens the book page, and remembers that we came from the set page. */
  protected readonly from = { from: 'set' };
}
