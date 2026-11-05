import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';

import { Book } from '../models/book';
import { MOCK_BOOKS } from './mock-books';

/** Development only: serves the fictional books after a short delay, like a real request. */
@Injectable({ providedIn: 'root' })
export class MockBooksApi {
  list(): Observable<Book[]> {
    return of(MOCK_BOOKS).pipe(delay(400));
  }

  get(slug: string): Observable<Book> {
    const book = MOCK_BOOKS.find((b) => b.slug === slug);
    return book
      ? of(book).pipe(delay(300))
      : throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }));
  }
}
