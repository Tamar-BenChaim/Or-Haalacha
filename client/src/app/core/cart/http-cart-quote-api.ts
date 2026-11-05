import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CartItemRef, CartLine, CartQuote, QuotedLine, QuoteStatus } from '../models/cart';

const STATUSES: readonly QuoteStatus[] = ['ok', 'limited', 'out_of_stock', 'unavailable'];

type Raw = Record<string, unknown>;

function isObject(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null;
}

function toRef(raw: Raw): CartItemRef {
  // The server may send the reference flat ({ type, slug }) or nested ({ ref: { type, slug } }).
  const source = isObject(raw['ref']) ? raw['ref'] : raw;
  const { type, slug } = source;
  if ((type !== 'book' && type !== 'bundle') || typeof slug !== 'string') {
    throw new Error('Unexpected item in POST /cart/quote response');
  }
  return { type, slug };
}

function toQuotedLine(value: unknown): QuotedLine {
  if (!isObject(value)) {
    throw new Error('Unexpected item in POST /cart/quote response');
  }
  const { quantity, requestedQuantity, status, title, unitPriceAgorot, lineTotalAgorot } = value;
  if (
    !Number.isSafeInteger(quantity) ||
    !Number.isSafeInteger(lineTotalAgorot) ||
    !STATUSES.includes(status as QuoteStatus)
  ) {
    throw new Error('Unexpected item in POST /cart/quote response');
  }
  return {
    ref: toRef(value),
    quantity: quantity as number,
    requestedQuantity: Number.isSafeInteger(requestedQuantity)
      ? (requestedQuantity as number)
      : (quantity as number),
    status: status as QuoteStatus,
    title: typeof title === 'string' ? title : null,
    unitPriceAgorot: Number.isSafeInteger(unitPriceAgorot) ? (unitPriceAgorot as number) : null,
    lineTotalAgorot: lineTotalAgorot as number,
  };
}

/**
 * POST /cart/quote. Only slugs and quantities are sent; the server ignores any price.
 * The response shape is checked here, because it comes from outside the app.
 * TODO: verify the field names against the real server when its branch is merged.
 */
@Injectable({ providedIn: 'root' })
export class HttpCartQuoteApi {
  private readonly http = inject(HttpClient);

  quote(lines: CartLine[]): Observable<CartQuote> {
    const body = {
      items: lines.map((line) => ({
        type: line.ref.type,
        slug: line.ref.slug,
        quantity: line.quantity,
      })),
    };
    return this.http.post<unknown>(`${environment.apiUrl}/cart/quote`, body).pipe(
      map((response) => {
        if (
          !isObject(response) ||
          !Array.isArray(response['items']) ||
          !Number.isSafeInteger(response['subtotalAgorot']) ||
          typeof response['allAvailable'] !== 'boolean'
        ) {
          throw new Error('Unexpected response from POST /cart/quote');
        }
        return {
          items: response['items'].map(toQuotedLine),
          subtotalAgorot: response['subtotalAgorot'] as number,
          allAvailable: response['allAvailable'],
        };
      }),
    );
  }
}
