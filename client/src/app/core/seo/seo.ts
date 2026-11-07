import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

const SITE_NAME = 'אור ההלכה';

/** Page title and the description / Open Graph tags used when a link is shared. */
@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  set(page: { title: string; description?: string | null }): void {
    const full = `${page.title} | ${SITE_NAME}`;
    this.title.setTitle(full);
    this.meta.updateTag({ property: 'og:title', content: full });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    if (page.description) {
      this.meta.updateTag({ name: 'description', content: page.description });
      this.meta.updateTag({ property: 'og:description', content: page.description });
    } else {
      this.meta.removeTag('name="description"');
      this.meta.removeTag('property="og:description"');
    }
  }
}
