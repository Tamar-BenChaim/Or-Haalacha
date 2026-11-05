import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { delay, map, Observable, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Bundle } from '../models/book';
import { MOCK_BUNDLES } from './mock-bundles';

/** Where the bundles (the full set) come from. */
export interface BundlesSource {
  list(): Observable<Bundle[]>;
}

/** GET /bundles. */
@Injectable({ providedIn: 'root' })
export class HttpBundlesApi {
  private readonly http = inject(HttpClient);

  list(): Observable<Bundle[]> {
    return this.http.get<{ bundles: Bundle[] }>(`${environment.apiUrl}/bundles`).pipe(
      map((response) => {
        if (!Array.isArray(response?.bundles)) {
          throw new Error('Unexpected response from GET /bundles');
        }
        return response.bundles;
      }),
    );
  }
}

/** Development only: the fictional full set. */
@Injectable({ providedIn: 'root' })
export class MockBundlesApi {
  list(): Observable<Bundle[]> {
    return of(MOCK_BUNDLES).pipe(delay(400));
  }
}

export const BUNDLES_SOURCE = new InjectionToken<BundlesSource>('BUNDLES_SOURCE', {
  providedIn: 'root',
  factory: () => (environment.useMockApi ? inject(MockBundlesApi) : inject(HttpBundlesApi)),
});
