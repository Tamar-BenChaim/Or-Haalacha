import { HttpError } from '../lib/httpError.js';
import { changedValues, diffFields } from './changes.js';

const bundleNotFound = () => new HttpError(404, 'BUNDLE_NOT_FOUND', 'Bundle not found');

/** Bundle management (the full set) for the admin area. Every change is audited. */
export function createAdminBundlesService({ bundles, books, auditService }) {
  return {
    async list() {
      return (await bundles.findAll()).map(toAdminBundle);
    },

    async update(id, requested, { actor, requestId }) {
      const current = await bundles.findById(id);
      if (!current) throw bundleNotFound();

      if (requested.bookSlugs) {
        const found = await books.findBySlugs(requested.bookSlugs);
        const unknown = requested.bookSlugs.filter((slug) => !found.some((b) => b.slug === slug));
        if (unknown.length > 0) {
          throw new HttpError(400, 'UNKNOWN_BOOKS', 'Some books in the bundle do not exist', [
            { location: 'body', path: 'bookSlugs', message: `Unknown: ${unknown.join(', ')}` },
          ]);
        }
      }

      const changes = diffFields(current, requested);
      if (Object.keys(changes).length === 0) return toAdminBundle(current);

      const updated = await bundles.updateById(id, changedValues(changes));
      if (!updated) throw bundleNotFound();

      await auditService.record({
        actor,
        requestId,
        action: 'bundle.update',
        entityType: 'bundle',
        entityId: id,
        changes,
      });
      return toAdminBundle(updated);
    },
  };
}

function toAdminBundle(bundle) {
  return {
    id: bundle._id.toString(),
    slug: bundle.slug,
    title: bundle.title,
    description: bundle.description,
    priceAgorot: bundle.priceAgorot,
    bookSlugs: bundle.bookSlugs,
    hidden: bundle.hidden,
    sortOrder: bundle.sortOrder,
    updatedAt: bundle.updatedAt,
  };
}
