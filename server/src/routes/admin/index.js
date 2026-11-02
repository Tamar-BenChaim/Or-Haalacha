import { Router } from 'express';
import { createAdminBooksController } from '../../controllers/admin/books.controller.js';
import { createAdminBundlesController } from '../../controllers/admin/bundles.controller.js';
import { requireJsonBody } from '../../middleware/requireJsonBody.js';
import { createAdminBooksService } from '../../services/adminBooks.service.js';
import { createAdminBundlesService } from '../../services/adminBundles.service.js';
import { adminBooksRoutes } from './books.routes.js';
import { adminBundlesRoutes } from './bundles.routes.js';

/** Every admin route requires an authenticated admin and is never cached. */
export function createAdminRoutes({ repositories, auditService, adminAuth }) {
  const router = Router();
  const { books, bundles } = repositories;

  router.use(adminAuth);
  router.use(requireJsonBody);
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  const adminBooksService = createAdminBooksService({ books, auditService });
  router.use(
    '/books',
    adminBooksRoutes({ adminBooksController: createAdminBooksController({ adminBooksService }) }),
  );

  const adminBundlesService = createAdminBundlesService({ bundles, books, auditService });
  router.use(
    '/bundles',
    adminBundlesRoutes({
      adminBundlesController: createAdminBundlesController({ adminBundlesService }),
    }),
  );

  return router;
}
