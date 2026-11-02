import { Router } from 'express';
import { z } from 'zod';
import { slugSchema } from '../lib/schemas.js';
import { validate } from '../middleware/validate.js';

const slugParams = z.object({ slug: slugSchema });

export function booksRoutes({ booksController }) {
  const router = Router();
  router.get('/', booksController.list);
  router.get('/:slug', validate({ params: slugParams }), booksController.getBySlug);
  return router;
}
