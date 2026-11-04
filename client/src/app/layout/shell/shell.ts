import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AnnouncementBar } from '../announcement-bar/announcement-bar';
import { CartDrawer } from '../cart-drawer/cart-drawer';
import { SiteFooter } from '../site-footer/site-footer';
import { SiteHeader } from '../site-header/site-header';

@Component({
  selector: 'oh-shell',
  imports: [RouterOutlet, AnnouncementBar, SiteHeader, SiteFooter, CartDrawer],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {}
