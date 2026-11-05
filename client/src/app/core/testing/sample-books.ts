// Fictional data for specs and local development only.
// Never import this file from production code: the real data comes from the API.
import { Book } from '../models/book';

export const sampleBook: Book = {
  id: 'sample-1',
  slug: 'sample-book-1',
  title: 'ספר לדוגמה א׳',
  volume: 1,
  topic: 'נושא לדוגמה',
  shortDescription: 'תיאור קצר לדוגמה',
  priceAgorot: 6500,
  inStock: true,
  coverImage: null,
};

export const sampleSoldOutBook: Book = {
  ...sampleBook,
  id: 'sample-2',
  slug: 'sample-book-2',
  title: 'ספר לדוגמה ב׳ (אזל)',
  volume: 2,
  inStock: false,
};

export const sampleBookWithImage: Book = {
  ...sampleBook,
  id: 'sample-3',
  slug: 'sample-book-3',
  title: 'ספר לדוגמה ג׳',
  volume: 3,
  coverImage: { url: '/cover.jpg', alt: 'כריכת ספר לדוגמה ג׳' },
};
