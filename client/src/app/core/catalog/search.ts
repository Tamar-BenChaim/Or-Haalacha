import { Book } from '../models/book';

// Ignored in searches:
// - POINTS: the Unicode range 0591-05C7 (Hebrew cantillation marks and points).
// - QUOTES: straight quotes, geresh, gershayim, and curly single/double quotes.
const POINTS = /[֑-ׇ]/g;
const QUOTES = /["'׳״‘’“”]/g;

/** Lower-cases, and removes points, quotes and extra spaces, so "ספר א׳" matches "ספר א". */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFC')
    .replace(POINTS, '')
    .replace(QUOTES, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** True when every word of the query appears in the title or the topic. An empty query matches all. */
export function matchesQuery(book: Pick<Book, 'title' | 'topic'>, query: string): boolean {
  const words = normalizeForSearch(query).split(' ').filter(Boolean);
  if (words.length === 0) {
    return true;
  }
  const haystack = normalizeForSearch(`${book.title} ${book.topic ?? ''}`);
  return words.every((word) => haystack.includes(word));
}
