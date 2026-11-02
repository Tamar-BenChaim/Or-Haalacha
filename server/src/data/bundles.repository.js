export function createBundleRepository(db) {
  const collection = db.collection('bundles');

  return {
    async ensureIndexes() {
      await collection.createIndex({ slug: 1 }, { name: 'slug_unique', unique: true });
    },

    findVisible() {
      return collection.find({ hidden: false }).sort({ sortOrder: 1 }).toArray();
    },

    findVisibleBySlugs(slugs) {
      return collection.find({ slug: { $in: slugs }, hidden: false }).toArray();
    },

    /** Inserts or replaces a bundle identified by its slug, keeping its original creation time. */
    async upsertBySlug(bundle, now = new Date()) {
      await collection.updateOne(
        { slug: bundle.slug },
        { $set: { ...bundle, updatedAt: now }, $setOnInsert: { createdAt: now } },
        { upsert: true },
      );
    },
  };
}
