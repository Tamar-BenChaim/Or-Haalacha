import { Router } from 'express';
import { z } from 'zod';
import { objectIdSchema } from '../../lib/objectId.js';
import { slugSchema } from '../../lib/schemas.js';
import { validate } from '../../middleware/validate.js';

const idParams = z.object({ id: objectIdSchema });

const updateBody = z
  .strictObject({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000),
    priceAgorot: z.number().int().min(1).max(10_000_000),
    bookSlugs: z
      .array(slugSchema)
      .min(2)
      .max(100)
      .refine((slugs) => new Set(slugs).size === slugs.length, 'Books must not repeat'),
    hidden: z.boolean(),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'Nothing to update');

export function adminBundlesRoutes({ adminBundlesController }) {
  const router = Router();
  router.get('/', adminBundlesController.list);
  router.patch(
    '/:id',
    validate({ params: idParams, body: updateBody }),
    adminBundlesController.update,
  );
  return router;
}
