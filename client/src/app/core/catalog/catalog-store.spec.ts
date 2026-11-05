import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';

import { Book } from '../models/book';
import { sampleBook } from '../testing/sample-books';
import { BOOKS_SOURCE } from './books-source';
import { CatalogStore } from './catalog-store';

function setup(list: () => Observable<Book[]>) {
  const source = { list: vi.fn(list) };
  TestBed.configureTestingModule({ providers: [{ provide: BOOKS_SOURCE, useValue: source }] });
  return { source, store: TestBed.inject(CatalogStore) };
}

describe('CatalogStore', () => {
  it('starts idle and empty', () => {
    const { store } = setup(() => of([]));
    expect(store.status()).toBe('idle');
    expect(store.books()).toEqual([]);
  });

  it('loads the books', () => {
    const { store } = setup(() => of([sampleBook]));
    store.load();
    expect(store.status()).toBe('ready');
    expect(store.books()).toEqual([sampleBook]);
  });

  it('is loading while waiting, and asks the source only once', () => {
    const pending = new Subject<Book[]>();
    const { store, source } = setup(() => pending);
    store.load();
    store.load();
    expect(store.status()).toBe('loading');
    pending.next([sampleBook]);
    store.load();
    expect(store.status()).toBe('ready');
    expect(source.list).toHaveBeenCalledTimes(1);
  });

  it('reports an error, and recovers on retry', () => {
    let fail = true;
    const { store, source } = setup(() =>
      fail ? throwError(() => new Error('down')) : of([sampleBook]),
    );
    store.load();
    expect(store.status()).toBe('error');
    fail = false;
    store.retry();
    expect(store.status()).toBe('ready');
    expect(source.list).toHaveBeenCalledTimes(2);
  });
});
