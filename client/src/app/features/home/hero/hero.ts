import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Opening area of the home page. The 3D gold title, the background and the
 * sparkles are added later, after the client chooses the final design.
 */
@Component({
  selector: 'oh-hero',
  imports: [RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {}
