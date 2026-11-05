// FICTIONAL data for local development only (environment.useMockApi).
// Production never uses it: the real books come from the API.
import { Book } from '../models/book';

const LETTERS = [
  'א',
  'ב',
  'ג',
  'ד',
  'ה',
  'ו',
  'ז',
  'ח',
  'ט',
  'י',
  'כ',
  'ל',
  'מ',
  'נ',
  'ס',
  'ע',
  'פ',
  'צ',
  'ק',
  'ר',
];
const TOPICS = ['נושא לדוגמה א׳', 'נושא לדוגמה ב׳', 'נושא לדוגמה ג׳', 'נושא לדוגמה ד׳'];

export const MOCK_BOOKS: Book[] = LETTERS.map((letter, index) => ({
  id: `mock-${index + 1}`,
  slug: `mock-book-${index + 1}`,
  title: `ספר לדוגמה ${letter}׳`,
  volume: index + 1,
  topic: TOPICS[index % TOPICS.length],
  shortDescription: 'תיאור קצר לדוגמה',
  priceAgorot: 5500 + (index % 5) * 500,
  // One book is sold out, to show that state.
  inStock: index !== 6,
  coverImage: null,
}));
