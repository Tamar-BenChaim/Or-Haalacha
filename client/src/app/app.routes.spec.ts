import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { routes } from './app.routes';

describe('routes', () => {
  function router() {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    return TestBed.inject(Router);
  }

  it.each(['set', 'about', 'contact'])(
    'sends the old address /%s to the matching section of the home page',
    async (section) => {
      const r = router();
      await r.navigateByUrl(`/${section}`);
      expect(r.url).toBe(`/#${section}`);
    },
  );

  it('does not catch longer addresses that start the same way', async () => {
    const r = router();
    await r.navigateByUrl('/about/us');
    expect(r.url).toBe('/about/us');
  });

  it('has no separate pages for the sections of the home page', () => {
    const paths = routes.map((route) => route.path);
    for (const path of ['set', 'about', 'contact']) {
      const route = routes.find((candidate) => candidate.path === path)!;
      expect(route.redirectTo, path).toBeTypeOf('function');
      expect(route.loadComponent, path).toBeUndefined();
    }
    expect(paths).toContain('book/:slug');
    expect(paths).toContain('cart');
    expect(paths).toContain('legal/:doc');
  });
});
