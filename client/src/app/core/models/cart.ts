import { Book } from './book';

export type CartItemRef = { type: 'book'; slug: string } | { type: 'bundle'; slug: string };

/** What is persisted in localStorage: only the slug and quantity, never prices. */
export interface CartLine {
  ref: CartItemRef;
  quantity: number;
}

export type QuoteStatus = 'ok' | 'limited' | 'out_of_stock' | 'unavailable';

/** One line of the POST /cart/quote response. Prices come from the server. */
export interface QuotedLine extends CartLine {
  title: string | null;
  unitPriceAgorot: number | null;
  lineTotalAgorot: number;
  requestedQuantity: number;
  status: QuoteStatus;
}

/** The POST /cart/quote response: every amount is calculated by the server, in agorot. */
export interface CartQuote {
  items: QuotedLine[];
  subtotalAgorot: number;
  allAvailable: boolean;
}

/** A cart line as shown to the user: the saved line plus what the server said about it. */
export interface CartItemView {
  line: CartLine;
  title: string | null;
  unitPriceAgorot: number | null;
  /** Null while the server has not priced the current quantity yet. */
  lineTotalAgorot: number | null;
  status: QuoteStatus | 'pending';
  /** What is needed to draw the cover, from the catalog. Null for sets or while it loads. */
  book: Pick<Book, 'title' | 'volume' | 'topic' | 'coverImage'> | null;
}
