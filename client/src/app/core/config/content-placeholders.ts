import { InjectionToken } from '@angular/core';

import { environment } from '../../../environments/environment';

/**
 * Whether to show sample boxes for content a book does not have yet (back cover, contents,
 * sample pages, "[—]" in the details table). On in development, off in production.
 * It is a token so tests can try both.
 */
export const SHOW_CONTENT_PLACEHOLDERS = new InjectionToken<boolean>('SHOW_CONTENT_PLACEHOLDERS', {
  providedIn: 'root',
  factory: () => environment.showContentPlaceholders,
});
