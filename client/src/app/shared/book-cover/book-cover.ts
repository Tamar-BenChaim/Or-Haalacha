import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Book } from '../../core/models/book';

/**
 * Shows the real cover image when there is one, otherwise a CSS cover
 * (burgundy, title and volume). Use `decorative` when the title is already
 * next to it, so screen readers do not read it twice.
 */
@Component({
  selector: 'oh-book-cover',
  templateUrl: './book-cover.html',
  styleUrl: './book-cover.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-hidden]': 'decorative() ? "true" : null',
    '[attr.role]': 'decorative() ? null : "img"',
    '[attr.aria-label]': 'decorative() ? null : book().coverImage?.alt || book().title',
  },
})
export class BookCover {
  readonly book = input.required<Pick<Book, 'title' | 'volume' | 'topic' | 'coverImage'>>();
  readonly decorative = input(false);
}
