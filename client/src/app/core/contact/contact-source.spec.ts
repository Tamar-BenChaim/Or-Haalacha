import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ContactMessage, HttpContactApi, MockContactApi } from './contact-source';

const message: ContactMessage = {
  name: 'דנה',
  contact: 'dana@example.com',
  subject: 'שאלה',
  message: 'שלום, יש לי שאלה על הסדרה.',
};

describe('HttpContactApi', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return { api: TestBed.inject(HttpContactApi), http: TestBed.inject(HttpTestingController) };
  }

  it('posts the message to POST /contact', () => {
    const { api, http } = setup();
    api.send(message).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/contact`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(message);
    request.flush(null);
    http.verify();
  });

  it('passes the status of a failure on (429 means too many messages)', () => {
    const { api, http } = setup();
    let status: number | undefined;
    api.send(message).subscribe({ error: (e) => (status = e.status) });
    http
      .expectOne(`${environment.apiUrl}/contact`)
      .flush({ error: { code: 'RATE_LIMITED' } }, { status: 429, statusText: 'Too Many Requests' });
    expect(status).toBe(429);
  });
});

describe('MockContactApi', () => {
  afterEach(() => vi.useRealTimers());

  it('pretends to send after a short delay', () => {
    vi.useFakeTimers();
    let done = false;
    TestBed.inject(MockContactApi)
      .send()
      .subscribe(() => (done = true));
    expect(done).toBe(false);
    vi.advanceTimersByTime(500);
    expect(done).toBe(true);
  });
});
