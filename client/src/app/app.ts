import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Shell } from './layout/shell/shell';

@Component({
  selector: 'oh-root',
  imports: [Shell],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
