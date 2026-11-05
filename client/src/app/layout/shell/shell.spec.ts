import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Shell } from './shell';

@Component({ template: '<h1>דף</h1>' })
class Page {}

describe('Shell', () => {
  function render() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Page },
          { path: 'about', component: Page },
        ]),
      ],
    });
    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, router: TestBed.inject(Router) };
  }

  it('has the skip link first, then header, main and footer landmarks', () => {
    const { el } = render();
    const first = el.querySelector('a')!;
    expect(first.classList.contains('skip')).toBe(true);
    expect(first.getAttribute('href')).toBe('#main');
    expect(el.querySelector('header')).toBeTruthy();
    expect(el.querySelector('main#main')).toBeTruthy();
    expect(el.querySelector('footer')).toBeTruthy();
  });

  it('shows no announcement bar by default', () => {
    expect(render().el.querySelector('.bar')).toBeNull();
  });

  it('moves focus to main when the skip link is used', () => {
    const { el } = render();
    el.querySelector<HTMLAnchorElement>('a.skip')!.click();
    expect(document.activeElement).toBe(el.querySelector('main'));
  });

  it('moves focus to main after navigating, but not on the first load', async () => {
    const { el, router } = render();
    const main = el.querySelector('main')!;
    await router.navigateByUrl('/');
    expect(document.activeElement).not.toBe(main);
    await router.navigateByUrl('/about');
    expect(document.activeElement).toBe(main);
  });
});
