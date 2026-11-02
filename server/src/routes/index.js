import { Router } from 'express';
import { createBooksController } from '../controllers/books.controller.js';
import { createBundlesController } from '../controllers/bundles.controller.js';
import { createCartController } from '../controllers/cart.controller.js';
import { createHealthController } from '../controllers/health.controller.js';
import { createBooksService } from '../services/books.service.js';
import { createBundlesService } from '../services/bundles.service.js';
import { createCartService } from '../services/cart.service.js';
import { createHealthService } from '../services/health.service.js';
import { booksRoutes } from './books.routes.js';
import { bundlesRoutes } from './bundles.routes.js';
import { cartRoutes } from './cart.routes.js';
import { healthRoutes } from './health.routes.js';

// Wires each feature: data access → service → controller → routes.
export function createRoutes({ database, repositories }) {
  const router = Router();
  const { books, bundles } = repositories;

  const healthService = createHealthService({ database });
  router.use(
    '/health',
    healthRoutes({ healthController: createHealthController({ healthService }) }),
  );

  const booksService = createBooksService({ books });
  router.use('/books', booksRoutes({ booksController: createBooksController({ booksService }) }));

  const bundlesService = createBundlesService({ books, bundles });
  router.use(
    '/bundles',
    bundlesRoutes({ bundlesController: createBundlesController({ bundlesService }) }),
  );

  const cartService = createCartService({ books, bundles });
  router.use('/cart', cartRoutes({ cartController: createCartController({ cartService }) }));

  return router;
}
