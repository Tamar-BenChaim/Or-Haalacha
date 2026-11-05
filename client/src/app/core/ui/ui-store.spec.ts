import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { UiStore } from './ui-store';

@Component({ template: '' })
class Page {}

describe('UiStore', () => {
  afterEach(() => vi.useRealTimers());

  function setup() {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'about', component: Page }])],
    });
    return TestBed.inject(UiStore);
  }

  it('opens and closes the side cart', () => {
    const ui = setup();
    expect(ui.drawerOpen()).toBe(false);
    ui.openDrawer();
    expect(ui.drawerOpen()).toBe(true);
    ui.closeDrawer();
    expect(ui.drawerOpen()).toBe(false);
  });

  it('closes the side cart when the user goes to another page', async () => {
    const ui = setup();
    ui.openDrawer();
    await TestBed.inject(Router).navigateByUrl('/about');
    expect(ui.drawerOpen()).toBe(false);
  });

  it('bumps for half a second', () => {
    vi.useFakeTimers();
    const ui = setup();
    ui.bump();
    expect(ui.bumping()).toBe(true);
    vi.advanceTimersByTime(500);
    expect(ui.bumping()).toBe(false);
  });
});
