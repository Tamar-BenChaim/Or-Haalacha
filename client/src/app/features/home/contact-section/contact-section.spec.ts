import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NEVER, Observable, of, throwError } from 'rxjs';

import { SHOW_CONTENT_PLACEHOLDERS } from '../../../core/config/content-placeholders';
import { CONTACT_SOURCE, ContactMessage } from '../../../core/contact/contact-source';
import { SiteSettingsStore } from '../../../core/settings/site-settings-store';
import { ContactSection } from './contact-section';

interface Options {
  /** Sample boxes for missing content (development). Default: on. */
  placeholders?: boolean;
  /** The phone number, if known. */
  phone?: string | null;
}

function setup(
  send: (message: ContactMessage) => Observable<void> = () => of(undefined),
  options: Options = {},
) {
  const source = { send: vi.fn(send) };
  TestBed.configureTestingModule({
    providers: [
      { provide: CONTACT_SOURCE, useValue: source },
      { provide: SHOW_CONTENT_PLACEHOLDERS, useValue: options.placeholders ?? true },
      {
        provide: SiteSettingsStore,
        useValue: {
          email: signal('support@orhaalacha.org').asReadonly(),
          phone: signal(options.phone ?? null).asReadonly(),
          announcement: signal(null).asReadonly(),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(ContactSection);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;

  const field = (id: string) => el.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)!;
  const fill = (id: string, value: string) => {
    const control = field(id);
    control.value = value;
    control.dispatchEvent(new Event('input'));
  };
  const blur = (id: string) => {
    field(id).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  };
  const submit = async () => {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const fillValid = () => {
    fill('contact-name', '  דנה  ');
    fill('contact-contact', 'dana@example.com');
    fill('contact-subject', 'שאלה');
    fill('contact-message', '  שלום, יש לי שאלה על הסדרה.  ');
    fixture.detectChanges();
  };
  const text = (selector: string) => el.querySelector(selector)?.textContent ?? '';
  return { fixture, el, source, field, fill, blur, submit, fillValid, text };
}

describe('ContactSection', () => {
  it('is the #contact section with an h2, and links the email', () => {
    const { el } = setup();
    expect(el.querySelector('section#contact')!.getAttribute('aria-labelledby')).toBe(
      'contact-title',
    );
    expect(el.querySelector('#contact-title')!.tagName).toBe('H2');
    expect(el.querySelector('h1')).toBeNull();
    expect(el.querySelector('a[href^="mailto:"]')!.getAttribute('href')).toBe(
      'mailto:support@orhaalacha.org',
    );
  });

  describe('the text and the details next to the form', () => {
    const rows = (el: HTMLElement) =>
      Array.from(el.querySelectorAll('.details .row')).map((row) => [
        row.querySelector('.label')!.textContent!.trim(),
        row.querySelector('.value')!.textContent!.trim(),
      ]);

    it('has the eyebrow, the gold rule and the line about what to write for', () => {
      const { el } = setup();
      expect(el.querySelector('.eyebrow')!.textContent).toContain('נשמח לעזור');
      expect(el.querySelector('.gold-rule')).toBeTruthy();
      expect(el.querySelector('.lead')!.textContent).toContain(
        'שאלות על הספרים, על הזמנה קיימת או על הזמנה מוסדית.',
      );
    });

    it('lists the email as a link, with its label', () => {
      const { el } = setup();
      expect(rows(el)[0]).toEqual(['מייל', 'support@orhaalacha.org']);
      expect(el.querySelector('.details a.row')!.getAttribute('href')).toBe(
        'mailto:support@orhaalacha.org',
      );
    });

    // The page's base style makes every link inside a list bold. A row that is a link (the
    // email) must not turn its label ("מייל") bold while the other row ("טלפון") is normal.
    it('writes the rows in the same weight, whether or not a row is a link', () => {
      // Development: the email row is a link, the phone row is only text ("[מספר טלפון]").
      const { el } = setup();
      const [email, phone] = Array.from(el.querySelectorAll('.details .row'));
      expect(email.tagName).toBe('A');
      expect(phone.tagName).toBe('DIV');
      expect(getComputedStyle(email).fontWeight).toBe(getComputedStyle(phone).fontWeight);
    });

    it('writes the rows in the same weight when both are links', () => {
      const { el } = setup(undefined, { phone: '050-123-4567' });
      const weights = Array.from(el.querySelectorAll('.details .row')).map(
        (row) => getComputedStyle(row).fontWeight,
      );
      expect(new Set(weights).size).toBe(1);
    });

    it('keeps the rows in normal weight (only the values are heavier)', () => {
      const { el } = setup();
      const row = getComputedStyle(el.querySelector('.details a.row')!).fontWeight;
      expect(['400', 'normal']).toContain(row);
    });

    it('writes the email and the phone left to right, so they read correctly', () => {
      const { el } = setup(undefined, { phone: '050-123-4567' });
      for (const value of Array.from(el.querySelectorAll('.details .value'))) {
        expect(value.getAttribute('dir')).toBe('ltr');
      }
    });

    it('lists the real phone as a call link', () => {
      const { el } = setup(undefined, { phone: '050-123-4567' });
      expect(rows(el)[1]).toEqual(['טלפון', '050-123-4567']);
      expect(el.querySelectorAll('.details a.row')[1].getAttribute('href')).toBe(
        'tel:050-123-4567',
      );
    });

    it('shows "[מספר טלפון]" while the phone is not known (development)', () => {
      const { el } = setup();
      expect(rows(el)[1]).toEqual(['טלפון', '[מספר טלפון]']);
      expect(el.querySelector('a[href^="tel:"]')).toBeNull();
    });

    it('hides the phone row in production while the phone is not known', () => {
      const { el } = setup(undefined, { placeholders: false });
      expect(rows(el)).toHaveLength(1);
      expect(el.querySelector('a[href^="tel:"]')).toBeNull();
    });
  });

  describe('the framed form', () => {
    it('is in a box of its own, with the heading "שליחת הודעה" under the section title', () => {
      const { el } = setup();
      expect(el.querySelector('.panel.tinted .form-title')!.textContent).toContain('שליחת הודעה');
      expect(el.querySelector('.form-title')!.tagName).toBe('H3');
    });

    it('puts the name and the email or phone side by side', () => {
      const { el } = setup();
      const pair = el.querySelector('.pair')!;
      expect(pair.querySelector('#contact-name')).toBeTruthy();
      expect(pair.querySelector('#contact-contact')).toBeTruthy();
      expect(pair.querySelector('#contact-subject')).toBeNull();
    });
  });

  it('has four fields, each with a label, and marks the three required ones', () => {
    const { el } = setup();
    for (const id of ['contact-name', 'contact-contact', 'contact-subject', 'contact-message']) {
      expect(el.querySelector(`label[for="${id}"]`), id).toBeTruthy();
    }
    const stars = Array.from(el.querySelectorAll('label')).filter((l) =>
      l.textContent!.includes('*'),
    );
    expect(stars.map((l) => l.getAttribute('for'))).toEqual([
      'contact-name',
      'contact-contact',
      'contact-message',
    ]);
  });

  it('gives the right keyboard hints for the fields', () => {
    const { field } = setup();
    expect(field('contact-name').getAttribute('autocomplete')).toBe('name');
    expect(field('contact-contact').getAttribute('autocomplete')).toBe('email');
  });

  describe('checking the form', () => {
    it('shows no error before the visitor touched anything', () => {
      expect(setup().el.querySelectorAll('.error')).toHaveLength(0);
    });

    it('shows an error under a field after the visitor leaves it empty', () => {
      const { blur, text } = setup();
      blur('contact-name');
      expect(text('#contact-name-error')).toContain('נא למלא שם');
    });

    it('links the error to the field and marks the field as invalid', () => {
      const { blur, field } = setup();
      blur('contact-name');
      expect(field('contact-name').getAttribute('aria-invalid')).toBe('true');
      expect(field('contact-name').getAttribute('aria-describedby')).toBe('contact-name-error');
    });

    it('asks for a valid email or phone', () => {
      const { fill, blur, text, fixture } = setup();
      fill('contact-contact', 'not valid');
      blur('contact-contact');
      fixture.detectChanges();
      expect(text('#contact-contact-error')).toContain('מייל או מספר טלפון תקינים');
    });

    it('asks for a longer message', () => {
      const { fill, blur, text } = setup();
      fill('contact-message', 'קצר');
      blur('contact-message');
      expect(text('#contact-message-error')).toContain('קצרה מדי');
    });

    it('does not send an incomplete form, shows every error and moves focus to the first one', async () => {
      const { source, submit, text, field } = setup();
      await submit();
      expect(source.send).not.toHaveBeenCalled();
      expect(text('#contact-name-error')).toBeTruthy();
      expect(text('#contact-contact-error')).toBeTruthy();
      expect(text('#contact-message-error')).toBeTruthy();
      expect(document.activeElement).toBe(field('contact-name'));
    });
  });

  describe('sending', () => {
    it('sends the trimmed values and says it was sent, in place of the form', async () => {
      const { el, source, submit, fillValid, text } = setup();
      fillValid();
      await submit();
      expect(source.send).toHaveBeenCalledWith({
        name: 'דנה',
        contact: 'dana@example.com',
        subject: 'שאלה',
        message: 'שלום, יש לי שאלה על הסדרה.',
      });
      expect(text('[role="status"] .sent-title')).toContain('ההודעה נשלחה');
      expect(text('[role="status"] .sent-note')).toContain('נחזור אליכם בהקדם.');
      expect(el.querySelector('form')).toBeNull();
    });

    it('can write another message, with an empty form', async () => {
      const { el, fixture, submit, fillValid, field } = setup();
      fillValid();
      await submit();
      el.querySelector<HTMLButtonElement>('.again')!.click();
      fixture.detectChanges();
      expect(el.querySelector('[role="status"]')).toBeNull();
      expect(field('contact-name').value).toBe('');
      expect(field('contact-message').value).toBe('');
    });

    it('accepts a phone number and an empty subject', async () => {
      const { source, submit, fill, fixture } = setup();
      fill('contact-name', 'דנה');
      fill('contact-contact', '050-123-4567');
      fill('contact-message', 'שלום, יש לי שאלה על הסדרה.');
      fixture.detectChanges();
      await submit();
      expect(source.send).toHaveBeenCalledWith(
        expect.objectContaining({ contact: '050-123-4567', subject: '' }),
      );
    });

    it('blocks a second click while sending', async () => {
      const { el, submit, fillValid } = setup(() => NEVER);
      fillValid();
      await submit();
      const button = el.querySelector<HTMLButtonElement>('button[type="submit"]')!;
      expect(button.disabled).toBe(true);
      expect(button.textContent).toContain('שולחים');
    });

    it('asks to wait when the server says there were too many messages (429)', async () => {
      const { submit, fillValid, text } = setup(() => throwError(() => ({ status: 429 })));
      fillValid();
      await submit();
      expect(text('[role="alert"]')).toContain('נשלחו הרבה הודעות');
    });

    it('offers another way when sending fails, and keeps what was written', async () => {
      const { submit, fillValid, text, field } = setup(() => throwError(() => ({ status: 500 })));
      fillValid();
      await submit();
      expect(text('[role="alert"]')).toContain('לא הצלחנו לשלוח');
      expect(text('[role="alert"]')).toContain('במייל');
      expect(field('contact-name').value).toBe('  דנה  ');
    });
  });
});
