import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-skeleton',
  imports: [],
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Skeleton {}
