import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

/** The sections of the home page, in order. Each has an element with this id. */
export const HOME_SECTIONS = ['books', 'set', 'about', 'contact'] as const;

/** How far below the bottom of the sticky header a section counts as "the current one". */
const MARGIN_PX = 48;

/**
 * Follows the scroll of the home page and tells which section the visitor is in,
 * so the matching link in the header can be highlighted. It is on only while the
 * home page is shown (see `start` and `halt`).
 */
@Injectable({ providedIn: 'root' })
export class ScrollSpy {
  private readonly document = inject(DOCUMENT);
  private readonly activeState = signal<string | null>(null);
  private stopListening: (() => void) | null = null;

  /** The id of the current section, or null at the top (the opening area) and on other pages. */
  readonly active = this.activeState.asReadonly();

  start(ids: readonly string[]): void {
    this.halt();
    const win = this.document.defaultView;
    if (!win) {
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      this.activeState.set(this.current(ids));
    };
    const schedule = () => {
      if (!frame) {
        frame = win.requestAnimationFrame(update);
      }
    };
    win.addEventListener('scroll', schedule, { passive: true });
    win.addEventListener('resize', schedule);
    update();

    this.stopListening = () => {
      win.removeEventListener('scroll', schedule);
      win.removeEventListener('resize', schedule);
      if (frame) {
        win.cancelAnimationFrame(frame);
      }
      this.activeState.set(null);
      this.stopListening = null;
    };
  }

  halt(): void {
    this.stopListening?.();
  }

  /** The last section whose top has passed the header. At the very bottom, the last section. */
  private current(ids: readonly string[]): string | null {
    const win = this.document.defaultView!;
    const root = this.document.documentElement;
    const header = this.document.querySelector('header');
    const line = (header?.getBoundingClientRect().height ?? 0) + MARGIN_PX;

    const atBottom = win.scrollY > 0 && win.innerHeight + win.scrollY >= root.scrollHeight - 2;
    if (atBottom) {
      return ids[ids.length - 1] ?? null;
    }

    let current: string | null = null;
    for (const id of ids) {
      const element = this.document.getElementById(id);
      if (element && element.getBoundingClientRect().top <= line) {
        current = id;
      }
    }
    return current;
  }
}
