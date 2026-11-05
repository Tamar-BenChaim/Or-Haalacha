import { Injectable, signal } from '@angular/core';

/**
 * Public site settings. Defaults for now; they will be loaded from the server
 * (announcement bar, contact details, shipping) once those endpoints exist.
 */
@Injectable({ providedIn: 'root' })
export class SiteSettingsStore {
  /** Top bar message, or null to hide the bar. */
  readonly announcement = signal<string | null>(null).asReadonly();
  readonly email = signal('support@orhaalacha.org').asReadonly();
  /** Not provided by the client yet: the footer hides it while null. */
  readonly phone = signal<string | null>(null).asReadonly();
}
