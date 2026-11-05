import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, Subject, switchMap } from 'rxjs';

import { Announcer } from '../a11y/announcer';
import { CartItemRef, CartItemView, CartLine, CartQuote } from '../models/cart';
import { SafeStorage } from '../storage/safe-storage';
import { UiStore } from '../ui/ui-store';
import { CART_QUOTE_SOURCE } from './cart-quote-source';

export const CART_STORAGE_KEY = 'oh.cart.v1';
export const MAX_QUANTITY = 99;
export const MAX_LINES = 50;
const MAX_SLUG_LENGTH = 100;

export type QuoteState = 'idle' | 'loading' | 'ready' | 'error';

export function refKey(ref: CartItemRef): string {
  return `${ref.type}:${ref.slug}`;
}

function toLine(entry: unknown): CartLine | null {
  if (typeof entry !== 'object' || entry === null) {
    return null;
  }
  const { ref, quantity } = entry as { ref?: unknown; quantity?: unknown };
  if (typeof ref !== 'object' || ref === null) {
    return null;
  }
  const { type, slug } = ref as { type?: unknown; slug?: unknown };
  if (
    (type !== 'book' && type !== 'bundle') ||
    typeof slug !== 'string' ||
    slug.length === 0 ||
    slug.length > MAX_SLUG_LENGTH ||
    !Number.isInteger(quantity) ||
    (quantity as number) < 1
  ) {
    return null;
  }
  return { ref: { type, slug }, quantity: Math.min(quantity as number, MAX_QUANTITY) };
}

/**
 * Reads the saved cart. localStorage can hold anything (old versions, edits, damage),
 * so only valid lines are kept and everything else is dropped.
 */
export function parseCartLines(raw: string | null): CartLine[] {
  if (!raw) {
    return [];
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) {
    return [];
  }
  const seen = new Set<string>();
  const lines: CartLine[] = [];
  for (const entry of data) {
    const line = toLine(entry);
    if (line && !seen.has(refKey(line.ref))) {
      seen.add(refKey(line.ref));
      lines.push(line);
    }
    if (lines.length === MAX_LINES) {
      break;
    }
  }
  return lines;
}

/**
 * The single source of truth for the cart. Only slugs and quantities are saved in the
 * browser. Titles, prices and availability always come from the server ("quote"), which
 * is asked again whenever the cart changes or is opened.
 */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly storage = inject(SafeStorage);
  private readonly ui = inject(UiStore);
  private readonly announcer = inject(Announcer);
  private readonly quoteSource = inject(CART_QUOTE_SOURCE);

  private readonly linesState = signal<CartLine[]>(
    parseCartLines(this.storage.getItem(CART_STORAGE_KEY)),
  );
  private readonly quoteStore = signal<CartQuote | null>(null);
  private readonly quoteStateSignal = signal<QuoteState>('idle');
  private readonly noticesState = signal<string[]>([]);
  private readonly requote = new Subject<void>();

  readonly lines = this.linesState.asReadonly();
  readonly quoteState = this.quoteStateSignal.asReadonly();
  /** Messages about changes the server made (a book ran out, a quantity was reduced). */
  readonly notices = this.noticesState.asReadonly();

  /** Total quantity of all items (shown in the header button). */
  readonly count = computed(() => this.linesState().reduce((sum, line) => sum + line.quantity, 0));
  readonly isEmpty = computed(() => this.linesState().length === 0);
  /** The server's subtotal, or null until it answered for the current cart. */
  readonly subtotalAgorot = computed(() =>
    this.quoteStateSignal() === 'ready' ? (this.quoteStore()?.subtotalAgorot ?? null) : null,
  );
  readonly canCheckout = computed(
    () =>
      !this.isEmpty() && this.quoteStateSignal() === 'ready' && !!this.quoteStore()?.allAvailable,
  );

  readonly items = computed<CartItemView[]>(() => {
    const quoted = new Map((this.quoteStore()?.items ?? []).map((q) => [refKey(q.ref), q]));
    return this.linesState().map((line) => {
      const q = quoted.get(refKey(line.ref));
      if (!q) {
        return {
          line,
          title: null,
          unitPriceAgorot: null,
          lineTotalAgorot: null,
          status: 'pending',
        };
      }
      return {
        line,
        title: q.title,
        unitPriceAgorot: q.unitPriceAgorot,
        // A total for a different quantity is out of date: show nothing until the server answers.
        lineTotalAgorot: q.quantity === line.quantity ? q.lineTotalAgorot : null,
        status: q.status,
      };
    });
  });

  constructor() {
    this.requote
      .pipe(
        // A newer request cancels the older one, so a slow answer never overwrites a fresh one.
        switchMap(() => {
          const lines = this.linesState();
          if (lines.length === 0) {
            return of(null);
          }
          return this.quoteSource.quote(lines).pipe(catchError(() => of('error' as const)));
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.applyQuote(result));

    // Another tab changed the cart.
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === CART_STORAGE_KEY || event.key === null) {
          this.linesState.set(parseCartLines(this.storage.getItem(CART_STORAGE_KEY)));
          this.revalidate();
        }
      });
    }
  }

  /** Adds an item, opens the side cart and animates the cart button. */
  addItem(ref: CartItemRef, quantity = 1): void {
    if (!Number.isInteger(quantity) || quantity < 1 || !this.isValidRef(ref)) {
      return;
    }
    const lines = this.linesState();
    const key = refKey(ref);
    let next: CartLine[];
    if (lines.some((line) => refKey(line.ref) === key)) {
      next = lines.map((line) =>
        refKey(line.ref) === key
          ? { ...line, quantity: Math.min(line.quantity + quantity, MAX_QUANTITY) }
          : line,
      );
    } else if (lines.length >= MAX_LINES) {
      this.announcer.announce('אי אפשר להוסיף לעגלה עוד פריטים שונים.');
      return;
    } else {
      next = [...lines, { ref, quantity: Math.min(quantity, MAX_QUANTITY) }];
    }
    this.setLines(next);
    this.announcer.announce('הפריט נוסף לעגלה');
    this.ui.openDrawer();
    this.ui.bump();
  }

  /** Sets the quantity of an item. Zero or less removes it. */
  setQuantity(ref: CartItemRef, quantity: number): void {
    if (!Number.isInteger(quantity)) {
      return;
    }
    if (quantity < 1) {
      this.remove(ref);
      return;
    }
    const key = refKey(ref);
    this.setLines(
      this.linesState().map((line) =>
        refKey(line.ref) === key ? { ...line, quantity: Math.min(quantity, MAX_QUANTITY) } : line,
      ),
    );
    this.announcer.announce('הכמות עודכנה');
  }

  remove(ref: CartItemRef): void {
    const key = refKey(ref);
    this.setLines(this.linesState().filter((line) => refKey(line.ref) !== key));
    this.announcer.announce('הפריט הוסר מהעגלה');
  }

  clear(): void {
    this.setLines([]);
  }

  /** Asks the server again for prices and availability. Call it when the cart is opened. */
  revalidate(): void {
    if (!this.isEmpty()) {
      this.quoteStateSignal.set('loading');
    }
    this.requote.next();
  }

  private isValidRef(ref: CartItemRef): boolean {
    return (
      (ref.type === 'book' || ref.type === 'bundle') &&
      typeof ref.slug === 'string' &&
      ref.slug.length > 0 &&
      ref.slug.length <= MAX_SLUG_LENGTH
    );
  }

  private setLines(lines: CartLine[], requote = true): void {
    this.linesState.set(lines);
    if (lines.length === 0) {
      this.storage.removeItem(CART_STORAGE_KEY);
    } else {
      this.storage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    }
    if (requote) {
      this.revalidate();
    }
  }

  private applyQuote(result: CartQuote | 'error' | null): void {
    if (result === null) {
      this.quoteStore.set(null);
      this.quoteStateSignal.set('idle');
      this.noticesState.set([]);
      return;
    }
    if (result === 'error') {
      this.quoteStateSignal.set('error');
      return;
    }

    const notices: string[] = [];
    let lines = this.linesState();
    for (const item of result.items) {
      const key = refKey(item.ref);
      if (item.status === 'unavailable') {
        lines = lines.filter((line) => refKey(line.ref) !== key);
        notices.push('פריט שאינו זמין יותר הוסר מהעגלה.');
      } else if (item.status === 'limited') {
        lines = lines.map((line) =>
          refKey(line.ref) === key ? { ...line, quantity: item.quantity } : line,
        );
        notices.push(`${item.title ?? 'הפריט'}: במלאי רק ${item.quantity}.`);
      }
    }
    if (lines !== this.linesState()) {
      // The server's answer already reflects these corrections: no need to ask again.
      this.setLines(lines, false);
    }
    this.quoteStore.set(result);
    this.quoteStateSignal.set('ready');
    this.noticesState.set(notices);
    if (notices.length > 0) {
      this.announcer.announce(notices.join(' '));
    }
  }
}
