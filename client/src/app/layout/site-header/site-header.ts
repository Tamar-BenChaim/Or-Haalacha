import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-site-header',
  imports: [],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {}
