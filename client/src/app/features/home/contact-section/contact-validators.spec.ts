import { FormControl } from '@angular/forms';

import { emailOrPhone } from './contact-validators';

const check = (value: string) => emailOrPhone(new FormControl(value, { nonNullable: true }));

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
