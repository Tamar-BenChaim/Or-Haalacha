import { sampleBooks } from './sampleBooks.js';

/** Inserts or refreshes the sample books. Safe to run repeatedly. */
export async function seedSampleBooks(books) {
  for (const book of sampleBooks) {
    await books.upsertBySlug(book);
  }
  return sampleBooks.length;
}
