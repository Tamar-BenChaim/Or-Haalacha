import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IsActiveMatchOptions, RouterLink, RouterLinkActive } from '@angular/router';

import { CartStore } from '../../core/cart/cart-store';
import { UiStore } from '../../core/ui/ui-store';

@Component({
  selector: 'oh-site-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  protected readonly cartCount = inject(CartStore).count;
  protected readonly ui = inject(UiStore);

  /** "Books" is active only on the home page at #books (the fragment must match). */
  protected readonly booksMatch: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'exact',
  };
}
