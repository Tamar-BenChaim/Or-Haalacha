import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';

import { MOCK_BOOKS } from '../catalog/mock-books';
import { CartLine, CartQuote, QuotedLine } from '../models/cart';

/**
 * Development only: plays the role of the server and prices the cart from the
 * fictional books, after a short delay. The real prices always come from the server.
 */
@Injectable({ providedIn: 'root' })
export class MockCartQuoteApi {
  quote(lines: CartLine[]): Observable<CartQuote> {
    const items = lines.map((line): QuotedLine => {
      const book =
        line.ref.type === 'book' ? MOCK_BOOKS.find((b) => b.slug === line.ref.slug) : null;
      if (!book) {
        return {
          ...line,
          requestedQuantity: line.quantity,
          title: null,
          unitPriceAgorot: null,
          lineTotalAgorot: 0,
          status: 'unavailable',
        };
      }
      return {
        ...line,
        requestedQuantity: line.quantity,
        title: book.title,
        unitPriceAgorot: book.priceAgorot,
        lineTotalAgorot: book.inStock ? book.priceAgorot * line.quantity : 0,
        status: book.inStock ? 'ok' : 'out_of_stock',
      };
    });
    const subtotalAgorot = items.reduce((sum, item) => sum + item.lineTotalAgorot, 0);
    const allAvailable = items.every((item) => item.status === 'ok');
    return of({ items, subtotalAgorot, allAvailable }).pipe(delay(250));
  }
}
