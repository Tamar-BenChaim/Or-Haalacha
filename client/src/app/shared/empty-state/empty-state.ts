import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-empty-state',
  imports: [],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {}
