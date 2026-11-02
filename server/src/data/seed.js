import { sampleBooks, sampleBundles } from './sampleBooks.js';

/** Inserts or refreshes the sample books and bundles. Safe to run repeatedly. */
export async function seedSampleData({ books, bundles }) {
  for (const book of sampleBooks) {
    await books.upsertBySlug(book);
  }
  for (const bundle of sampleBundles) {
    await bundles.upsertBySlug(bundle);
  }
  return { books: sampleBooks.length, bundles: sampleBundles.length };
}
