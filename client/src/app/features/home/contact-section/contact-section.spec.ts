import { TestBed } from '@angular/core/testing';
import { NEVER, Observable, of, throwError } from 'rxjs';

import { CONTACT_SOURCE, ContactMessage } from '../../../core/contact/contact-source';
import { ContactSection } from './contact-section';

function setup(send: (message: ContactMessage) => Observable<void> = () => of(undefined)) {
  const source = { send: vi.fn(send) };
  TestBed.configureTestingModule({ providers: [{ provide: CONTACT_SOURCE, useValue: source }] });
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

  it('hides the phone while it is not provided', () => {
    expect(setup().el.querySelector('a[href^="tel:"]')).toBeNull();
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
    it('sends the trimmed values, says it was sent, and empties the form', async () => {
      const { source, submit, fillValid, text, field } = setup();
      fillValid();
      await submit();
      expect(source.send).toHaveBeenCalledWith({
        name: 'דנה',
        contact: 'dana@example.com',
        subject: 'שאלה',
        message: 'שלום, יש לי שאלה על הסדרה.',
      });
      expect(text('[role="status"]')).toContain('ההודעה נשלחה. נחזור אליך בהקדם.');
      expect(field('contact-name').value).toBe('');
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
