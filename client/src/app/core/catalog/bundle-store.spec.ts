import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Bundle } from '../models/book';
import { sampleBook } from '../testing/sample-books';
import { BUNDLES_SOURCE, HttpBundlesApi } from './bundles-source';
import { BundleStore } from './bundle-store';

const fullSet: Bundle = {
  id: 's',
  slug: 'full-set',
  title: 'הסט המלא',
  description: '',
  priceAgorot: 90000,
  separatePriceAgorot: 120000,
  inStock: true,
  books: [sampleBook],
};
const other: Bundle = { ...fullSet, id: 'o', slug: 'other' };

function setup(list: () => Observable<Bundle[]>) {
  const source = { list: vi.fn(list) };
  TestBed.configureTestingModule({ providers: [{ provide: BUNDLES_SOURCE, useValue: source }] });
  return { source, store: TestBed.inject(BundleStore) };
}

describe('BundleStore', () => {
  it('loads once and picks the full set', () => {
    const { store, source } = setup(() => of([other, fullSet]));
    store.load();
    store.load();
    expect(store.status()).toBe('ready');
    expect(store.fullSet()).toEqual(fullSet);
    expect(source.list).toHaveBeenCalledTimes(1);
  });

  it('falls back to the first bundle, or to nothing', () => {
    const first = setup(() => of([other]));
    first.store.load();
    expect(first.store.fullSet()).toEqual(other);
  });

  it('has no set before loading', () => {
    const { store } = setup(() => of([]));
    expect(store.fullSet()).toBeNull();
  });

  it('reports an error and recovers on retry', () => {
    let fail = true;
    const { store } = setup(() => (fail ? throwError(() => new Error('down')) : of([fullSet])));
    store.load();
    expect(store.status()).toBe('error');
    fail = false;
    store.retry();
    expect(store.status()).toBe('ready');
  });
});

describe('HttpBundlesApi', () => {
  function http() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      api: TestBed.inject(HttpBundlesApi),
      controller: TestBed.inject(HttpTestingController),
    };
  }

  it('reads the bundles from GET /bundles', () => {
    const { api, controller } = http();
    let result: unknown;
    api.list().subscribe((bundles) => (result = bundles));
    const request = controller.expectOne(`${environment.apiUrl}/bundles`);
    expect(request.request.method).toBe('GET');
    request.flush({ bundles: [fullSet] });
    expect(result).toEqual([fullSet]);
  });

  it('fails on an unexpected response shape', () => {
    const { api, controller } = http();
    let failed = false;
    api.list().subscribe({ error: () => (failed = true) });
    controller.expectOne(`${environment.apiUrl}/bundles`).flush({ nope: 1 });
    expect(failed).toBe(true);
  });
});
