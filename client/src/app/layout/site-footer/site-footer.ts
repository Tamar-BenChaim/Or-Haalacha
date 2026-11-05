import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SiteSettingsStore } from '../../core/settings/site-settings-store';

@Component({
  selector: 'oh-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  private readonly settings = inject(SiteSettingsStore);
  protected readonly email = this.settings.email;
  protected readonly phone = this.settings.phone;
  protected readonly year = new Date().getFullYear();
}
