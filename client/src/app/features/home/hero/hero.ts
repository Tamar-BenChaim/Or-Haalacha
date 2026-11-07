import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SHOW_CONTENT_PLACEHOLDERS } from '../../../core/config/content-placeholders';
import { HeroTitle } from '../hero-title/hero-title';

/**
 * The opening area of the home page: burgundy, with the 3D gold title and five sparkles
 * around it that grow and glow when the page opens, then twinkle slowly. All motion is CSS
 * and is switched off for people who prefer reduced motion.
 */
@Component({
  selector: 'oh-hero',
  imports: [RouterLink, HeroTitle],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  /** The line under the title and "by the Rabbi" come from the client; sample text in development. */
  protected readonly placeholders = inject(SHOW_CONTENT_PLACEHOLDERS);
  protected readonly sparkles = [1, 2, 3, 4, 5];
}
