import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';

import { Seo } from './seo';

describe('Seo', () => {
  it('sets the page title with the site name, and the Open Graph title', () => {
    TestBed.inject(Seo).set({ title: 'ספר לדוגמה' });
    expect(TestBed.inject(Title).getTitle()).toBe('ספר לדוגמה | אור ההלכה');
    expect(TestBed.inject(Meta).getTag('property="og:title"')!.content).toBe(
      'ספר לדוגמה | אור ההלכה',
    );
  });

  it('sets the description, and removes an old one when the next page has none', () => {
    const seo = TestBed.inject(Seo);
    const meta = TestBed.inject(Meta);

    seo.set({ title: 'א', description: 'תיאור' });
    expect(meta.getTag('name="description"')!.content).toBe('תיאור');
    expect(meta.getTag('property="og:description"')!.content).toBe('תיאור');

    seo.set({ title: 'ב' });
    expect(meta.getTag('name="description"')).toBeNull();
    expect(meta.getTag('property="og:description"')).toBeNull();
  });
});
