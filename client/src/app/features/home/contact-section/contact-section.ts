import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { SHOW_CONTENT_PLACEHOLDERS } from '../../../core/config/content-placeholders';
import { CONTACT_SOURCE } from '../../../core/contact/contact-source';
import { SiteSettingsStore } from '../../../core/settings/site-settings-store';
import { Field } from '../../../shared/field/field';
import {
  CONTACT_LIMITS,
  emailOrPhone,
  requiredText,
  trimmedMaxLength,
  trimmedMinLength,
} from './contact-validators';

type SendStatus = 'idle' | 'sending' | 'sent' | 'error' | 'limited';
type FieldName = 'name' | 'contact' | 'subject' | 'message';

const MESSAGES: Record<FieldName, Record<string, string>> = {
  name: {
    required: 'נא למלא שם.',
    minlength: 'השם קצר מדי.',
    maxlength: 'השם ארוך מדי.',
  },
  contact: {
    required: 'נא למלא מייל או טלפון.',
    emailOrPhone: 'נא להזין כתובת מייל או מספר טלפון תקינים.',
  },
  subject: { maxlength: 'הנושא ארוך מדי.' },
  message: {
    required: 'נא לכתוב הודעה.',
    minlength: 'ההודעה קצרה מדי.',
    maxlength: 'ההודעה ארוכה מדי.',
  },
};

/** Contact details and the contact form (#contact). */
@Component({
  selector: 'oh-contact-section',
  imports: [ReactiveFormsModule, Field],
  templateUrl: './contact-section.html',
  styleUrl: './contact-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSection {
  private readonly source = inject(CONTACT_SOURCE);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly settings = inject(SiteSettingsStore);

  protected readonly email = this.settings.email;
  protected readonly phone = this.settings.phone;
  /** Shows "[מספר טלפון]" while the phone is not known (development only, like the mockup). */
  protected readonly placeholders = inject(SHOW_CONTENT_PLACEHOLDERS);

  protected readonly status = signal<SendStatus>('idle');
  /** Errors are shown only after the visitor left the field or tried to send. */
  protected readonly submitted = signal(false);

  /** The longest each field may be; the form stops the typing there. */
  protected readonly limits = CONTACT_LIMITS;

  // Lengths count the text without spaces at its ends, so a field of spaces only is empty.
  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        requiredText,
        trimmedMinLength(CONTACT_LIMITS.name.min),
        trimmedMaxLength(CONTACT_LIMITS.name.max),
      ],
    }),
    contact: new FormControl('', {
      nonNullable: true,
      validators: [requiredText, emailOrPhone, trimmedMaxLength(CONTACT_LIMITS.contact.max)],
    }),
    subject: new FormControl('', {
      nonNullable: true,
      validators: [trimmedMaxLength(CONTACT_LIMITS.subject.max)],
    }),
    message: new FormControl('', {
      nonNullable: true,
      validators: [
        requiredText,
        trimmedMinLength(CONTACT_LIMITS.message.min),
        trimmedMaxLength(CONTACT_LIMITS.message.max),
      ],
    }),
  });

  /** The error to show under a field, or null. */
  protected errorOf(name: FieldName): string | null {
    const control = this.form.controls[name];
    if (!control.errors || !(control.touched || this.submitted())) {
      return null;
    }
    const code = Object.keys(control.errors)[0];
    return MESSAGES[name][code] ?? 'הערך אינו תקין.';
  }

  protected send(): void {
    this.submitted.set(true);
    this.status.set('idle');
    if (this.form.invalid) {
      // After the errors are on the screen, move focus to the first field with an error.
      afterNextRender(
        () => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        { injector: this.injector },
      );
      return;
    }

    this.status.set('sending');
    const value = this.form.getRawValue();
    this.source
      .send({
        name: value.name.trim(),
        contact: value.contact.trim(),
        subject: value.subject.trim(),
        message: value.message.trim(),
      })
      .subscribe({
        next: () => {
          this.form.reset();
          this.submitted.set(false);
          this.status.set('sent');
        },
        error: (error: { status?: number }) =>
          this.status.set(error?.status === 429 ? 'limited' : 'error'),
      });
  }

  /** After a message was sent, shows an empty form again. */
  protected writeAnother(): void {
    this.status.set('idle');
  }
}
