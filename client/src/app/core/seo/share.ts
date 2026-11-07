import { Injectable } from '@angular/core';

export type ShareResult = 'shared' | 'copied' | 'failed';

/** Shares a link: the phone's share sheet when there is one, otherwise copies it. */
@Injectable({ providedIn: 'root' })
export class Share {
  async share(page: { url: string; title: string }): Promise<ShareResult> {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(page);
        return 'shared';
      } catch (error) {
        // The user closing the share sheet is not a failure.
        if (error instanceof DOMException && error.name === 'AbortError') {
          return 'failed';
        }
      }
    }
    try {
      await navigator.clipboard.writeText(page.url);
      return 'copied';
    } catch {
      return 'failed';
    }
  }
}
