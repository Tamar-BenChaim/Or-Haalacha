import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-hero-title',
  imports: [],
  templateUrl: './hero-title.html',
  styleUrl: './hero-title.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroTitle {}
