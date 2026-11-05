import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { sampleBook } from '../testing/sample-books';
import { HttpBooksApi } from './http-books-api';

describe('HttpBooksApi', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return { api: TestBed.inject(HttpBooksApi), http: TestBed.inject(HttpTestingController) };
  }

  it('reads the books from GET /books', () => {
    const { api, http } = setup();
    let result: unknown;
    api.list().subscribe((books) => (result = books));

    const request = http.expectOne(`${environment.apiUrl}/books`);
    expect(request.request.method).toBe('GET');
    request.flush({ books: [sampleBook] });

    expect(result).toEqual([sampleBook]);
    http.verify();
  });

  it('fails on an unexpected response shape', () => {
    const { api, http } = setup();
    let failed = false;
    api.list().subscribe({ error: () => (failed = true) });

    http.expectOne(`${environment.apiUrl}/books`).flush({ nope: true });

    expect(failed).toBe(true);
  });
});
