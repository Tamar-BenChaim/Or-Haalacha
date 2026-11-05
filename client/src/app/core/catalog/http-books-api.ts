import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Book } from '../models/book';

/** GET /books: the books that are shown, in display order. */
@Injectable({ providedIn: 'root' })
export class HttpBooksApi {
  private readonly http = inject(HttpClient);

  list(): Observable<Book[]> {
    return this.http.get<{ books: Book[] }>(`${environment.apiUrl}/books`).pipe(
      map((response) => {
        if (!Array.isArray(response?.books)) {
          throw new Error('Unexpected response from GET /books');
        }
        return response.books;
      }),
    );
  }
}
