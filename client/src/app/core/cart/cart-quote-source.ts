import { inject, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CartLine, CartQuote } from '../models/cart';
import { HttpCartQuoteApi } from './http-cart-quote-api';
import { MockCartQuoteApi } from './mock-cart-quote-api';

/** Prices and availability of a cart, calculated by the server (never by the browser). */
export interface CartQuoteSource {
  quote(lines: CartLine[]): Observable<CartQuote>;
}

/** The real API, or a fictional one when `environment.useMockApi` is true. */
export const CART_QUOTE_SOURCE = new InjectionToken<CartQuoteSource>('CART_QUOTE_SOURCE', {
  providedIn: 'root',
  factory: () => (environment.useMockApi ? inject(MockCartQuoteApi) : inject(HttpCartQuoteApi)),
});
