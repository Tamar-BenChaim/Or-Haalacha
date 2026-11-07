// FICTIONAL data for local development only (environment.useMockApi).
import { Bundle } from '../models/book';
import { MOCK_BOOKS } from './mock-books';

const separate = MOCK_BOOKS.reduce((sum, book) => sum + book.priceAgorot, 0);

export const MOCK_BUNDLES: Bundle[] = [
  {
    id: 'mock-set',
    slug: 'full-set',
    title: 'הסט המלא – 20 כרכים',
    description: 'כל ספרי הסדרה יחד, במחיר מיוחד.',
    priceAgorot: 99000,
    separatePriceAgorot: separate,
    inStock: true,
    books: MOCK_BOOKS,
  },
];
