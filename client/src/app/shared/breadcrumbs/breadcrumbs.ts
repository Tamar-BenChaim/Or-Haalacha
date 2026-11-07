import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Crumb {
  label: string;
  /** A router link for the parents. The last crumb (the current page) has none. */
  link?: string | unknown[];
  /** A section of that page (for example "set" for /#set). */
  fragment?: string;
}

/** "Home › Page" trail. The last item is the current page. */
@Component({
  selector: 'oh-breadcrumbs',
  imports: [RouterLink],
  templateUrl: './breadcrumbs.html',
  styleUrl: './breadcrumbs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Breadcrumbs {
  readonly items = input.required<Crumb[]>();
}
