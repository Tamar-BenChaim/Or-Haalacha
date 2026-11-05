import { LiveAnnouncer } from '@angular/cdk/a11y';
import { inject, Injectable } from '@angular/core';

/** Tells screen reader users about changes that are not otherwise announced (cart updates). */
@Injectable({ providedIn: 'root' })
export class Announcer {
  private readonly live = inject(LiveAnnouncer);

  announce(message: string): void {
    void this.live.announce(message, 'polite');
  }
}
