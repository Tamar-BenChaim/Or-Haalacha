import { Router } from 'express';

export function bundlesRoutes({ bundlesController }) {
  const router = Router();
  router.get('/', bundlesController.list);
  return router;
}
