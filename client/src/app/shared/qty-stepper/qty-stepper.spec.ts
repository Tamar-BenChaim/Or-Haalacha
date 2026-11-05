import { TestBed } from '@angular/core/testing';

import { QtyStepper } from './qty-stepper';

function render(inputs: { value: number; min?: number; max?: number }) {
  const fixture = TestBed.createComponent(QtyStepper);
  fixture.componentRef.setInput('value', inputs.value);
  if (inputs.min !== undefined) fixture.componentRef.setInput('min', inputs.min);
  if (inputs.max !== undefined) fixture.componentRef.setInput('max', inputs.max);
  fixture.detectChanges();
  const emitted: number[] = [];
  fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
  const el = fixture.nativeElement as HTMLElement;
  const [plus, minus] = Array.from(el.querySelectorAll<HTMLButtonElement>('button'));
  return { el, plus, minus, emitted };
}

describe('QtyStepper', () => {
  it('shows the value and has accessible button names', () => {
    const { el, plus, minus } = render({ value: 3 });
    expect(el.querySelector('.value')!.textContent).toContain('3');
    expect(plus.getAttribute('aria-label')).toBe('הגדלת כמות');
    expect(minus.getAttribute('aria-label')).toBe('הפחתת כמות');
  });

  it('emits the next value on + and −', () => {
    const { plus, minus, emitted } = render({ value: 3 });
    plus.click();
    minus.click();
    expect(emitted).toEqual([4, 2]);
  });

  it('cannot go below the minimum', () => {
    const { minus, emitted } = render({ value: 1 });
    expect(minus.disabled).toBe(true);
    minus.click();
    expect(emitted).toEqual([]);
  });

  it('can reach zero when the minimum is zero (to remove an item)', () => {
    const { minus, emitted } = render({ value: 1, min: 0 });
    expect(minus.disabled).toBe(false);
    minus.click();
    expect(emitted).toEqual([0]);
  });

  it('cannot go above the maximum', () => {
    const { plus, emitted } = render({ value: 99 });
    expect(plus.disabled).toBe(true);
    plus.click();
    expect(emitted).toEqual([]);
  });
});
