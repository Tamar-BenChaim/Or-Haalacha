import { Router } from 'express';
import { createBooksController } from '../controllers/books.controller.js';
import { createHealthController } from '../controllers/health.controller.js';
import { createBooksService } from '../services/books.service.js';
import { createHealthService } from '../services/health.service.js';
import { booksRoutes } from './books.routes.js';
import { healthRoutes } from './health.routes.js';

// Wires each feature: data access → service → controller → routes.
export function createRoutes({ database, repositories }) {
  const router = Router();

  const healthService = createHealthService({ database });
  router.use(
    '/health',
    healthRoutes({ healthController: createHealthController({ healthService }) }),
  );

  const booksService = createBooksService({ books: repositories.books });
  router.use('/books', booksRoutes({ booksController: createBooksController({ booksService }) }));

  return router;
}
