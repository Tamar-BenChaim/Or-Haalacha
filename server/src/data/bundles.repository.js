import { toObjectId } from '../lib/objectId.js';

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

    findAll() {
      return collection.find({}).sort({ sortOrder: 1 }).toArray();
    },

    findById(id) {
      return collection.findOne({ _id: toObjectId(id) });
    },

    /** Sets the given fields. Resolves to the updated bundle, or null if it does not exist. */
    updateById(id, fields, now = new Date()) {
      return collection.findOneAndUpdate(
        { _id: toObjectId(id) },
        { $set: { ...fields, updatedAt: now } },
        { returnDocument: 'after' },
      );
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
