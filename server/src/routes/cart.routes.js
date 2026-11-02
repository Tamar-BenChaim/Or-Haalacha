import { Router } from 'express';
import { z } from 'zod';
import { slugSchema } from '../lib/schemas.js';
import { validate } from '../middleware/validate.js';

export const MAX_CART_LINES = 50;
export const MAX_LINE_QUANTITY = 99;

const quoteBody = z.object({
  items: z
    .array(
      z.object({
        type: z.enum(['book', 'bundle']),
        slug: slugSchema,
        quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
      }),
    )
    .max(MAX_CART_LINES),
});

export function cartRoutes({ cartController }) {
  const router = Router();
  router.post('/quote', validate({ body: quoteBody }), cartController.quote);
  return router;
}
