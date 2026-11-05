import { inject, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Book } from '../models/book';
import { HttpBooksApi } from './http-books-api';
import { MockBooksApi } from './mock-books-api';

/** Where the books come from. The rest of the app does not care which one it is. */
export interface BooksSource {
  list(): Observable<Book[]>;
}

/** The real API, or the fictional books when `environment.useMockApi` is true. */
export const BOOKS_SOURCE = new InjectionToken<BooksSource>('BOOKS_SOURCE', {
  providedIn: 'root',
  factory: () => (environment.useMockApi ? inject(MockBooksApi) : inject(HttpBooksApi)),
});
