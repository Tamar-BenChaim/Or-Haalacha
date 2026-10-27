export function createBookRepository(db) {
  const collection = db.collection('books');

  return {
    async ensureIndexes() {
      await collection.createIndex({ slug: 1 }, { name: 'slug_unique', unique: true });
      await collection.createIndex({ hidden: 1, sortOrder: 1 }, { name: 'visible_order' });
    },

    findVisible() {
      return collection.find({ hidden: false }).sort({ sortOrder: 1 }).toArray();
    },

    findVisibleBySlug(slug) {
      return collection.findOne({ slug, hidden: false });
    },

    /** Inserts or replaces a book identified by its slug, keeping its original creation time. */
    async upsertBySlug(book, now = new Date()) {
      await collection.updateOne(
        { slug: book.slug },
        { $set: { ...book, updatedAt: now }, $setOnInsert: { createdAt: now } },
        { upsert: true },
      );
    },
  };
}
