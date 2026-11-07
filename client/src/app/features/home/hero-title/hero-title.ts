import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The big title "אור ההלכה" in 3D gold lettering, made with CSS (no picture): a dark
 * extruded layer (stacked shadows) under a gold gradient face. It is decoration only
 * (`aria-hidden`): the real heading is the visually hidden h1 in the hero.
 */
@Component({
  selector: 'oh-hero-title',
  templateUrl: './hero-title.html',
  styleUrl: './hero-title.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class HeroTitle {
  protected readonly text = 'אור ההלכה';
}
