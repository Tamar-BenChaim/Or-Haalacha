import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  function render() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(SiteFooter);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('links the four legal documents', () => {
    const hrefs = Array.from(render().querySelectorAll('nav[aria-label="מידע משפטי"] a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toEqual(['/legal/terms', '/legal/privacy', '/legal/returns', '/legal/a11y']);
  });

  it('shows the contact email as a mailto link', () => {
    const mail = render().querySelector('a[href^="mailto:"]')!;
    expect(mail.getAttribute('href')).toBe('mailto:support@orhaalacha.org');
  });

  it('hides the phone while it is not provided', () => {
    expect(render().querySelector('a[href^="tel:"]')).toBeNull();
  });

  it('shows the copyright with the current year', () => {
    expect(render().textContent).toContain(`© ${new Date().getFullYear()}`);
  });
});
