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
