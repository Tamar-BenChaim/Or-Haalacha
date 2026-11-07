import { AbstractControl, ValidationErrors } from '@angular/forms';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The "email or phone" field: a valid email, or a phone number (7 to 15 digits, with
 * spaces, dashes, parentheses or a leading "+" allowed). The server checks it again.
 */
export function emailOrPhone(control: AbstractControl<string>): ValidationErrors | null {
  const value = (control.value ?? '').trim();
  if (value === '' || EMAIL.test(value)) {
    return null;
  }
  const phone = /^\+?[\d\s\-()]+$/.test(value);
  const digits = value.replace(/\D/g, '').length;
  return phone && digits >= 7 && digits <= 15 ? null : { emailOrPhone: true };
}
