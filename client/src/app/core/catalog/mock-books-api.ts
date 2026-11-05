import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';

import { Book } from '../models/book';
import { MOCK_BOOKS } from './mock-books';

/** Development only: serves the fictional books after a short delay, like a real request. */
@Injectable({ providedIn: 'root' })
export class MockBooksApi {
  list(): Observable<Book[]> {
    return of(MOCK_BOOKS).pipe(delay(400));
  }
}
