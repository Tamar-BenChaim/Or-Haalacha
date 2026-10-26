import express from 'express';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { rejectUnsafeKeys } from './middleware/rejectUnsafeKeys.js';
import { requestId } from './middleware/requestId.js';
import { requestLog } from './middleware/requestLog.js';
import { corsPolicy, rateLimiter, securityHeaders } from './middleware/security.js';
import { createRoutes } from './routes/index.js';

const BODY_LIMIT = '100kb';

/** Builds the Express app without listening, so tests can drive it directly. */
export function createApp({ config, logger, logStore, database }) {
  const app = express();

  app.set('trust proxy', config.trustProxy);
  app.set('query parser', 'simple');

  app.use(requestId);
  app.use(requestLog({ logStore, logger }));
  app.use(securityHeaders());
  app.use(corsPolicy(config));
  app.use(rateLimiter(config.rateLimit));
  app.use(express.json({ limit: BODY_LIMIT }));
  app.use(rejectUnsafeKeys);

  app.use(createRoutes({ database }));

  app.use(notFound);
  app.use(errorHandler({ logger }));

  return app;
}
