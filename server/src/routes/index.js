import { Router } from 'express';
import { createHealthController } from '../controllers/health.controller.js';
import { createHealthService } from '../services/health.service.js';
import { healthRoutes } from './health.routes.js';

// Wires each feature: data access → service → controller → routes.
export function createRoutes() {
  const router = Router();

  const healthService = createHealthService();
  router.use(
    '/health',
    healthRoutes({ healthController: createHealthController({ healthService }) }),
  );

  return router;
}
