import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** How long each field may be. The same numbers limit the typing in the form. */
export const CONTACT_LIMITS = {
  name: { min: 2, max: 80 },
  contact: { max: 254 },
  subject: { max: 100 },
  message: { min: 10, max: 2000 },
} as const;

const textOf = (control: AbstractControl<string>) => (control.value ?? '').trim();

/**
 * "Required" for text. Angular's own `required` accepts spaces only (" ") as a value, and
 * after trimming the server would get an empty message.
 */
export function requiredText(control: AbstractControl<string>): ValidationErrors | null {
  return textOf(control) === '' ? { required: true } : null;
}

/** At least `min` characters, not counting spaces at the start and the end. */
export function trimmedMinLength(min: number): ValidatorFn {
  return (control) => {
    const actualLength = textOf(control).length;
    return actualLength < min ? { minlength: { requiredLength: min, actualLength } } : null;
  };
}

/** At most `max` characters, not counting spaces at the start and the end. */
export function trimmedMaxLength(max: number): ValidatorFn {
  return (control) => {
    const actualLength = textOf(control).length;
    return actualLength > max ? { maxlength: { requiredLength: max, actualLength } } : null;
  };
}

/**
 * The "email or phone" field: a valid email, or a phone number (7 to 15 digits, with
 * spaces, dashes, parentheses or a leading "+" allowed). The server checks it again.
 */
export function emailOrPhone(control: AbstractControl<string>): ValidationErrors | null {
  const value = textOf(control);
  if (value === '' || EMAIL.test(value)) {
    return null;
  }
  const phone = /^\+?[\d\s\-()]+$/.test(value);
  const digits = value.replace(/\D/g, '').length;
  return phone && digits >= 7 && digits <= 15 ? null : { emailOrPhone: true };
}
