import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { delay, Observable, of } from 'rxjs';

import { environment } from '../../../environments/environment';

/** What the visitor wrote in the contact form. */
export interface ContactMessage {
  name: string;
  /** An email address or a phone number. */
  contact: string;
  subject: string;
  message: string;
}

/** Where contact messages are sent. Fails with an HTTP error (status 429 means "too many"). */
export interface ContactSource {
  send(message: ContactMessage): Observable<void>;
}

/**
 * POST /contact. The server sends the message by email and does not store it.
 * TODO: the endpoint does not exist yet, and the Cloudflare Turnstile token
 * (bot protection) is added to the request when it does.
 */
@Injectable({ providedIn: 'root' })
export class HttpContactApi {
  private readonly http = inject(HttpClient);

  send(message: ContactMessage): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/contact`, message);
  }
}

/** Development only: pretends the message was sent. */
@Injectable({ providedIn: 'root' })
export class MockContactApi {
  send(): Observable<void> {
    return of(undefined).pipe(delay(500));
  }
}

export const CONTACT_SOURCE = new InjectionToken<ContactSource>('CONTACT_SOURCE', {
  providedIn: 'root',
  factory: () => (environment.useMockApi ? inject(MockContactApi) : inject(HttpContactApi)),
});
