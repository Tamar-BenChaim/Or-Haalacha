import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-contact',
  imports: [],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {}
