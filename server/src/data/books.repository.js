import { toObjectId } from '../lib/objectId.js';

const DUPLICATE_KEY = 11000;

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

    findVisibleBySlugs(slugs) {
      return collection.find({ slug: { $in: slugs }, hidden: false }).toArray();
    },

    findAll() {
      return collection.find({}).sort({ sortOrder: 1 }).toArray();
    },

    findById(id) {
      return collection.findOne({ _id: toObjectId(id) });
    },

    findBySlugs(slugs) {
      return collection.find({ slug: { $in: slugs } }).toArray();
    },

    async maxSortOrder() {
      const [last] = await collection.find({}).sort({ sortOrder: -1 }).limit(1).toArray();
      return last?.sortOrder ?? 0;
    },

    /** Inserts a new book. Resolves to null when the slug is already taken. */
    async insert(book, now = new Date()) {
      const document = { ...book, createdAt: now, updatedAt: now };
      try {
        const { insertedId } = await collection.insertOne(document);
        return { ...document, _id: insertedId };
      } catch (err) {
        if (err.code === DUPLICATE_KEY) return null;
        throw err;
      }
    },

    /** Sets the given fields. Resolves to the updated book, or null if it does not exist. */
    updateById(id, fields, now = new Date()) {
      return collection.findOneAndUpdate(
        { _id: toObjectId(id) },
        { $set: { ...fields, updatedAt: now } },
        { returnDocument: 'after' },
      );
    },

    /** Sets the display order: the first id gets sortOrder 1, the next 2, and so on. */
    async setDisplayOrder(ids, now = new Date()) {
      await collection.bulkWrite(
        ids.map((id, index) => ({
          updateOne: {
            filter: { _id: toObjectId(id) },
            update: { $set: { sortOrder: index + 1, updatedAt: now } },
          },
        })),
      );
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
