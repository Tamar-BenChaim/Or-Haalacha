import { TestBed } from '@angular/core/testing';

import { Book } from '../models/book';
import { MOCK_BOOKS } from './mock-books';
import { MockBooksApi } from './mock-books-api';

describe('MockBooksApi', () => {
  afterEach(() => vi.useRealTimers());

  it('returns one book with its full description', () => {
    vi.useFakeTimers();
    let result: Book | undefined;
    TestBed.inject(MockBooksApi)
      .get(MOCK_BOOKS[2].slug)
      .subscribe((book) => (result = book));
    vi.advanceTimersByTime(400);
    expect(result!.slug).toBe(MOCK_BOOKS[2].slug);
    expect(result!.description).toBeTruthy();
  });

  it('fails with status 404 for an unknown book', () => {
    let error: { status?: number } | undefined;
    TestBed.inject(MockBooksApi)
      .get('nope')
      .subscribe({ error: (e) => (error = e) });
    expect(error!.status).toBe(404);
  });
});
