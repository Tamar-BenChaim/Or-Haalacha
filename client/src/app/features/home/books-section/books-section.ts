import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The books list, a section of its own (#books). The nav link "Books" jumps here
 * instantly, with no scrolling animation. The list itself comes with the catalog feature.
 */
@Component({
  selector: 'oh-books-section',
  templateUrl: './books-section.html',
  styleUrl: './books-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BooksSection {}
