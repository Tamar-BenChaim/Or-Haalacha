import { FormControl, Validators } from '@angular/forms';

import {
  CONTACT_LIMITS,
  emailOrPhone,
  requiredText,
  trimmedMaxLength,
  trimmedMinLength,
} from './contact-validators';

const control = (value: string) => new FormControl(value, { nonNullable: true });
const check = (value: string) => emailOrPhone(control(value));

describe('requiredText', () => {
  it('rejects empty text and text of spaces only', () => {
    for (const value of ['', ' ', '     ', '\t', '\n', ' \n\t ']) {
      expect(requiredText(control(value)), JSON.stringify(value)).toEqual({ required: true });
    }
  });

  it('accepts any text with a visible character', () => {
    expect(requiredText(control('א'))).toBeNull();
    expect(requiredText(control('  שלום  '))).toBeNull();
  });

  it('is stricter than the Angular "required", which accepts spaces only', () => {
    // This is the gap that was fixed: "   " used to pass, and an empty text was sent.
    expect(Validators.required(control('   '))).toBeNull();
    expect(requiredText(control('   '))).toEqual({ required: true });
  });
});

describe('trimmedMinLength', () => {
  it('counts the text without the spaces at its ends', () => {
    expect(trimmedMinLength(2)(control('  א  '))).toEqual({
      minlength: { requiredLength: 2, actualLength: 1 },
    });
    expect(trimmedMinLength(2)(control(' אב '))).toBeNull();
  });

  it('rejects ten spaces as a message of ten characters', () => {
    expect(trimmedMinLength(CONTACT_LIMITS.message.min)(control(' '.repeat(10)))).toBeTruthy();
  });

  it('keeps spaces inside the text', () => {
    expect(trimmedMinLength(5)(control('א ב ג'))).toBeNull();
  });
});

describe('trimmedMaxLength', () => {
  it('allows exactly the maximum and rejects one more', () => {
    expect(trimmedMaxLength(5)(control('12345'))).toBeNull();
    expect(trimmedMaxLength(5)(control('123456'))).toEqual({
      maxlength: { requiredLength: 5, actualLength: 6 },
    });
  });

  it('does not count the spaces at the ends', () => {
    expect(trimmedMaxLength(5)(control('   12345   '))).toBeNull();
  });
});

describe('the limits of the fields', () => {
  it('are what the server is told to expect (docs/client-spec-angular.md)', () => {
    expect(CONTACT_LIMITS).toEqual({
      name: { min: 2, max: 80 },
      contact: { max: 254 },
      subject: { max: 100 },
      message: { min: 10, max: 2000 },
    });
  });
});

describe('emailOrPhone', () => {
  it.each([
    'name@example.com',
    'a.b+c@sub.example.co.il',
    '  name@example.com  ',
    '0501234567',
    '050-123-4567',
    '+972 50 123 4567',
    '(02) 123 4567',
    '1234567',
  ])('accepts %s', (value) => {
    expect(check(value)).toBeNull();
  });

  it.each([
    'name',
    'name@',
    '@example.com',
    'name@example',
    'name @example.com',
    '12345',
    '1234567890123456',
    '050-abc-4567',
    'שלום',
  ])('rejects %s', (value) => {
    expect(check(value)).toEqual({ emailOrPhone: true });
  });

  it('leaves an empty value to the "required" check', () => {
    expect(check('')).toBeNull();
    expect(check('   ')).toBeNull();
  });
});
