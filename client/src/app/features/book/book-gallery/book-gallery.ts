import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'oh-book-gallery',
  imports: [],
  templateUrl: './book-gallery.html',
  styleUrl: './book-gallery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookGallery {}
