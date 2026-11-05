import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Field } from './field';

@Component({
  imports: [Field],
  template: `
    <oh-field controlId="phone" label="טלפון" [required]="true" [error]="error">
      <input id="phone" />
    </oh-field>
  `,
})
class Host {
  error: string | null = null;
}

describe('Field', () => {
  function render(error: string | null) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.error = error;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('links the label to the control and marks required', () => {
    const el = render(null);
    const label = el.querySelector('label')!;
    expect(label.getAttribute('for')).toBe('phone');
    expect(label.textContent).toContain('טלפון');
    expect(label.textContent).toContain('*');
    expect(el.querySelector('input#phone')).toBeTruthy();
  });

  it('shows no error element when there is no error', () => {
    expect(render(null).querySelector('.error')).toBeNull();
  });

  it('announces the error with a stable id', () => {
    const error = render('שדה חובה').querySelector('.error')!;
    expect(error.getAttribute('role')).toBe('alert');
    expect(error.id).toBe('phone-error');
    expect(error.textContent).toContain('שדה חובה');
  });
});
