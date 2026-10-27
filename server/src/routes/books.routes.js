import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';

const slugParams = z.object({
  slug: z
    .string()
    .max(100)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Invalid book address'),
});

export function booksRoutes({ booksController }) {
  const router = Router();
  router.get('/', booksController.list);
  router.get('/:slug', validate({ params: slugParams }), booksController.getBySlug);
  return router;
}
