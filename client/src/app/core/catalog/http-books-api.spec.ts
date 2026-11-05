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

  it('reads one book from GET /books/:slug, with the slug encoded', () => {
    const { api, http } = setup();
    let result: unknown;
    api.get('a b/ג').subscribe((book) => (result = book));
    const request = http.expectOne(`${environment.apiUrl}/books/${encodeURIComponent('a b/ג')}`);
    request.flush({ book: sampleBook });
    expect(result).toEqual(sampleBook);
  });

  it('passes a 404 on, and fails on an unexpected shape', () => {
    const { api, http } = setup();
    let status: number | undefined;
    api.get('x').subscribe({ error: (e) => (status = e.status) });
    http
      .expectOne(`${environment.apiUrl}/books/x`)
      .flush({ error: { code: 'BOOK_NOT_FOUND' } }, { status: 404, statusText: 'Not Found' });
    expect(status).toBe(404);

    let failed = false;
    api.get('y').subscribe({ error: () => (failed = true) });
    http.expectOne(`${environment.apiUrl}/books/y`).flush({ nope: true });
    expect(failed).toBe(true);
  });
});
