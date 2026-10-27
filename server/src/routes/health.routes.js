import { Router } from 'express';

export function healthRoutes({ healthController }) {
  const router = Router();
  router.get('/', healthController.get);
  return router;
}
