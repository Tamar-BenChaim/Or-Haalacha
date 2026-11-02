import { Router } from 'express';
import { z } from 'zod';
import { objectIdSchema } from '../../lib/objectId.js';
import { slugSchema } from '../../lib/schemas.js';
import { validate } from '../../middleware/validate.js';

const MAX_PRICE_AGOROT = 10_000_000;
const MAX_STOCK = 100_000;

const editableFields = {
  title: z.string().trim().min(1).max(200),
  volume: z.number().int().min(1).max(999).nullable(),
  shortDescription: z.string().trim().max(300),
  description: z.string().trim().max(5000),
  priceAgorot: z.number().int().min(1).max(MAX_PRICE_AGOROT),
  stock: z.number().int().min(0).max(MAX_STOCK),
  lowStockThreshold: z.number().int().min(0).max(MAX_STOCK),
  hidden: z.boolean(),
};

const idParams = z.object({ id: objectIdSchema });

const createBody = z.strictObject({
  slug: slugSchema,
  ...editableFields,
  volume: editableFields.volume.default(null),
  shortDescription: editableFields.shortDescription.default(''),
  description: editableFields.description.default(''),
  lowStockThreshold: editableFields.lowStockThreshold.default(0),
  hidden: editableFields.hidden.default(false),
});

// The slug is not editable: shared links and saved carts depend on it.
const updateBody = z
  .strictObject(editableFields)
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'Nothing to update');

const reorderBody = z.object({ ids: z.array(objectIdSchema).min(1).max(1000) });

export function adminBooksRoutes({ adminBooksController }) {
  const router = Router();
  router.get('/', adminBooksController.list);
  router.post('/', validate({ body: createBody }), adminBooksController.create);
  // Declared before /:id so "order" is not taken for an id.
  router.put('/order', validate({ body: reorderBody }), adminBooksController.reorder);
  router.get('/:id', validate({ params: idParams }), adminBooksController.get);
  router.patch(
    '/:id',
    validate({ params: idParams, body: updateBody }),
    adminBooksController.update,
  );
  return router;
}
