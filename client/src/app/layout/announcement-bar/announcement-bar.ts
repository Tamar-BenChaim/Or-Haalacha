import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Optional top bar. Renders nothing when there is no message. */
@Component({
  selector: 'oh-announcement-bar',
  templateUrl: './announcement-bar.html',
  styleUrl: './announcement-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementBar {
  readonly message = input<string | null>(null);
}
