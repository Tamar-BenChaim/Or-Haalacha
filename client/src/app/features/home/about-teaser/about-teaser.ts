import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-about-teaser',
  imports: [],
  templateUrl: './about-teaser.html',
  styleUrl: './about-teaser.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutTeaser {}
