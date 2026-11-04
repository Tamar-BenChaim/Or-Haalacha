import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-announcement-bar',
  imports: [],
  templateUrl: './announcement-bar.html',
  styleUrl: './announcement-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementBar {}
