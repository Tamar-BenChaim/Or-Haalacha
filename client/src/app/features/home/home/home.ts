import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BooksSection } from '../books-section/books-section';
import { Hero } from '../hero/hero';

/** Home page: the hero area first, then the books list (a separate section, #books). */
@Component({
  selector: 'oh-home',
  imports: [Hero, BooksSection],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}
