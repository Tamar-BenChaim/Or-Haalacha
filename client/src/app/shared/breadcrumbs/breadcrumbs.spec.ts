import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Breadcrumbs, Crumb } from './breadcrumbs';

function render(items: Crumb[]) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(Breadcrumbs);
  fixture.componentRef.setInput('items', items);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('Breadcrumbs', () => {
  it('is a labelled navigation with a list', () => {
    const el = render([{ label: 'דף הבית', link: '/' }, { label: 'ספר' }]);
    expect(el.querySelector('nav')!.getAttribute('aria-label')).toBe('פירורי לחם');
    expect(el.querySelectorAll('li')).toHaveLength(2);
  });

  it('links the parents and marks the last item as the current page', () => {
    const el = render([
      { label: 'דף הבית', link: '/' },
      { label: 'הסט המלא', link: '/set' },
      { label: 'ספר' },
    ]);
    const links = Array.from(el.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/', '/set']);
    const current = el.querySelector('[aria-current="page"]')!;
    expect(current.textContent).toContain('ספר');
    expect(current.tagName).toBe('SPAN');
  });

  it('hides the separators from screen readers', () => {
    const el = render([{ label: 'דף הבית', link: '/' }, { label: 'ספר' }]);
    expect(el.querySelector('.sep')!.getAttribute('aria-hidden')).toBe('true');
  });
});
