import { HttpError } from '../lib/httpError.js';
import { changedValues, diffFields } from './changes.js';

const bookNotFound = () => new HttpError(404, 'BOOK_NOT_FOUND', 'Book not found');

/**
 * Book management for the admin area. Books are never deleted, only hidden,
 * because orders refer to them. A book's slug is fixed once it is created,
 * so shared links and saved carts keep working. Every change is audited.
 */
export function createAdminBooksService({ books, auditService }) {
  return {
    async list() {
      return (await books.findAll()).map(toAdminBook);
    },

    async get(id) {
      const book = await books.findById(id);
      if (!book) throw bookNotFound();
      return toAdminBook(book);
    },

    async create(input, { actor, requestId }) {
      const created = await books.insert({
        volume: null,
        coverImage: null,
        ...input,
        sortOrder: (await books.maxSortOrder()) + 1,
      });
      if (!created) {
        throw new HttpError(409, 'SLUG_TAKEN', 'A book with this address already exists');
      }

      await auditService.record({
        actor,
        requestId,
        action: 'book.create',
        entityType: 'book',
        entityId: created._id.toString(),
        changes: diffFields({}, input),
      });
      return toAdminBook(created);
    },

    async update(id, requested, { actor, requestId }) {
      const current = await books.findById(id);
      if (!current) throw bookNotFound();

      const changes = diffFields(current, requested);
      if (Object.keys(changes).length === 0) return toAdminBook(current);

      const updated = await books.updateById(id, changedValues(changes));
      if (!updated) throw bookNotFound();

      await auditService.record({
        actor,
        requestId,
        action: 'book.update',
        entityType: 'book',
        entityId: id,
        changes,
      });
      return toAdminBook(updated);
    },

    /** ids must list every book exactly once, in the new display order. */
    async reorder(ids, { actor, requestId }) {
      const all = await books.findAll();
      const currentIds = all.map((book) => book._id.toString());
      const sameBooks =
        ids.length === currentIds.length &&
        new Set(ids).size === ids.length &&
        ids.every((id) => currentIds.includes(id));
      if (!sameBooks) {
        throw new HttpError(400, 'INVALID_ORDER', 'The order must list every book exactly once');
      }

      await books.setDisplayOrder(ids);
      await auditService.record({
        actor,
        requestId,
        action: 'book.reorder',
        entityType: 'book',
        changes: { order: { from: currentIds, to: ids } },
      });
      return (await books.findAll()).map(toAdminBook);
    },
  };
}

function toAdminBook(book) {
  return {
    id: book._id.toString(),
    slug: book.slug,
    title: book.title,
    volume: book.volume ?? null,
    shortDescription: book.shortDescription,
    description: book.description,
    priceAgorot: book.priceAgorot,
    stock: book.stock,
    lowStockThreshold: book.lowStockThreshold,
    lowStock: book.stock <= book.lowStockThreshold,
    coverImage: book.coverImage ?? null,
    hidden: book.hidden,
    sortOrder: book.sortOrder,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };
}
