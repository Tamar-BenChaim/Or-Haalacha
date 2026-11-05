import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CartItemView } from '../../core/models/cart';
import { CartLineRow } from './cart-line';

const base: CartItemView = {
  line: { ref: { type: 'book', slug: 'a' }, quantity: 2 },
  title: 'ספר לדוגמה',
  unitPriceAgorot: 6500,
  lineTotalAgorot: 13000,
  status: 'ok',
};

function render(item: CartItemView) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(CartLineRow);
  fixture.componentRef.setInput('item', item);
  fixture.detectChanges();
  const quantities: number[] = [];
  let removed = 0;
  fixture.componentInstance.quantityChange.subscribe((q) => quantities.push(q));
  fixture.componentInstance.removed.subscribe(() => removed++);
  return { el: fixture.nativeElement as HTMLElement, quantities, removed: () => removed };
}

describe('CartLineRow', () => {
  it('links the title to the book page and shows price and total', () => {
    const { el } = render(base);
    const link = el.querySelector('a.title')!;
    expect(link.textContent).toContain('ספר לדוגמה');
    expect(link.getAttribute('href')).toBe('/book/a');
    expect(el.querySelector('.unit')!.textContent).toContain('65');
    expect(el.querySelector('.total')!.textContent).toContain('130');
  });

  it('links a set to the set page', () => {
    const { el } = render({
      ...base,
      line: { ref: { type: 'bundle', slug: 'full-set' }, quantity: 1 },
    });
    expect(el.querySelector('a.title')!.getAttribute('href')).toBe('/set');
  });

  it('shows a loading title and no prices while the server has not answered', () => {
    const { el } = render({
      ...base,
      title: null,
      unitPriceAgorot: null,
      lineTotalAgorot: null,
      status: 'pending',
    });
    expect(el.querySelector('a.title')!.textContent).toContain('טוען');
    expect(el.querySelector('.unit')).toBeNull();
    expect(el.querySelector('.total')!.textContent!.trim()).toBe('');
  });

  it('warns about a sold out book', () => {
    const { el } = render({ ...base, status: 'out_of_stock', lineTotalAgorot: 0 });
    expect(el.querySelector('.warn')!.textContent).toContain('אזל במלאי');
  });

  it('emits the new quantity from the stepper, and "removed" from the remove button', () => {
    const { el, quantities, removed } = render(base);
    el.querySelector<HTMLButtonElement>('button[aria-label="הגדלת כמות"]')!.click();
    expect(quantities).toEqual([3]);
    el.querySelector<HTMLButtonElement>('button.remove')!.click();
    expect(removed()).toBe(1);
  });

  it('names the remove button after the item', () => {
    const { el } = render(base);
    expect(el.querySelector('button.remove')!.getAttribute('aria-label')).toBe(
      'הסרה מהעגלה: ספר לדוגמה',
    );
  });

  it('removes the item when the stepper goes down to zero', () => {
    const { el, quantities } = render({ ...base, line: { ...base.line, quantity: 1 } });
    el.querySelector<HTMLButtonElement>('button[aria-label="הפחתת כמות"]')!.click();
    expect(quantities).toEqual([0]);
  });
});
