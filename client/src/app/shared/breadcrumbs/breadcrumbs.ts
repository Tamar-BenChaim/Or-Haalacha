import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-breadcrumbs',
  imports: [],
  templateUrl: './breadcrumbs.html',
  styleUrl: './breadcrumbs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Breadcrumbs {}
