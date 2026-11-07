import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * About the series and the author (#about). The text and the photos from the lessons
 * come from the client; until then this shows clearly marked sample text.
 */
@Component({
  selector: 'oh-about-section',
  imports: [RouterLink],
  templateUrl: './about-section.html',
  styleUrl: './about-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutSection {
  /** Three photos from the lessons, side by side. */
  protected readonly photos = [1, 2, 3];
}
