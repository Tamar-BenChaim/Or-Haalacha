import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartStore } from '../../core/cart/cart-store';
import { ScrollSpy } from '../../core/ui/scroll-spy';
import { UiStore } from '../../core/ui/ui-store';

interface NavItem {
  /** The id of the home page section the link jumps to. */
  section: string;
  label: string;
}

@Component({
  selector: 'oh-site-header',
  imports: [RouterLink],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  protected readonly cartCount = inject(CartStore).count;
  protected readonly ui = inject(UiStore);
  /** The section on the screen. Its link is highlighted. */
  protected readonly activeSection = inject(ScrollSpy).active;

  protected readonly items: NavItem[] = [
    { section: 'books', label: 'הספרים' },
    { section: 'set', label: 'הסט המלא' },
    { section: 'about', label: 'אודות' },
    { section: 'contact', label: 'צור קשר' },
  ];
}
