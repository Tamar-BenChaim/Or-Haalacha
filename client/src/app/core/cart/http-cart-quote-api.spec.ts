import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { CartQuote } from '../models/cart';
import { HttpCartQuoteApi } from './http-cart-quote-api';

describe('HttpCartQuoteApi', () => {
  const url = `${environment.apiUrl}/cart/quote`;

  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return { api: TestBed.inject(HttpCartQuoteApi), http: TestBed.inject(HttpTestingController) };
  }

  const line = { ref: { type: 'book' as const, slug: 'a' }, quantity: 2 };
  const answer = {
    items: [
      {
        type: 'book',
        slug: 'a',
        quantity: 2,
        requestedQuantity: 2,
        title: 'ספר א',
        unitPriceAgorot: 6500,
        lineTotalAgorot: 13000,
        status: 'ok',
      },
    ],
    subtotalAgorot: 13000,
    allAvailable: true,
  };

  it('posts only the type, slug and quantity (never a price)', () => {
    const { api, http } = setup();
    api.quote([line]).subscribe();
    const request = http.expectOne(url);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ items: [{ type: 'book', slug: 'a', quantity: 2 }] });
    request.flush(answer);
    http.verify();
  });

  it('maps the answer', () => {
    const { api, http } = setup();
    let result: CartQuote | undefined;
    api.quote([line]).subscribe((value) => (result = value));
    http.expectOne(url).flush(answer);
    expect(result).toEqual({
      items: [
        {
          ref: { type: 'book', slug: 'a' },
          quantity: 2,
          requestedQuantity: 2,
          title: 'ספר א',
          unitPriceAgorot: 6500,
          lineTotalAgorot: 13000,
          status: 'ok',
        },
      ],
      subtotalAgorot: 13000,
      allAvailable: true,
    });
  });

  it('also accepts the reference nested under "ref", and null prices for unavailable items', () => {
    const { api, http } = setup();
    let result: CartQuote | undefined;
    api.quote([line]).subscribe((value) => (result = value));
    http.expectOne(url).flush({
      items: [
        {
          ref: { type: 'book', slug: 'a' },
          quantity: 2,
          lineTotalAgorot: 0,
          status: 'unavailable',
          title: null,
          unitPriceAgorot: null,
        },
      ],
      subtotalAgorot: 0,
      allAvailable: false,
    });
    expect(result!.items[0]).toMatchObject({
      ref: { type: 'book', slug: 'a' },
      title: null,
      unitPriceAgorot: null,
    });
  });

  it.each([
    ['not an object', 'oops'],
    ['no items', { subtotalAgorot: 0, allAvailable: true }],
    ['a price that is not a whole number of agorot', { ...answer, subtotalAgorot: 130.5 }],
    ['an unknown status', { ...answer, items: [{ ...answer.items[0], status: 'weird' }] }],
    ['an unknown item type', { ...answer, items: [{ ...answer.items[0], type: 'x' }] }],
  ])('fails on a malformed answer: %s', (_name, body) => {
    const { api, http } = setup();
    let failed = false;
    api.quote([line]).subscribe({ error: () => (failed = true) });
    http.expectOne(url).flush(body);
    expect(failed).toBe(true);
  });
});
