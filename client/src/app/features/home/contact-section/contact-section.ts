import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CONTACT_SOURCE } from '../../../core/contact/contact-source';
import { SiteSettingsStore } from '../../../core/settings/site-settings-store';
import { Field } from '../../../shared/field/field';
import { emailOrPhone } from './contact-validators';

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

  protected readonly status = signal<SendStatus>('idle');
  /** Errors are shown only after the visitor left the field or tried to send. */
  protected readonly submitted = signal(false);

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(80)],
    }),
    contact: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, emailOrPhone],
    }),
    subject: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    message: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(2000)],
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
}
