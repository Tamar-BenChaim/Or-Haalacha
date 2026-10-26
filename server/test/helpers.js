import express from 'express';
import pino from 'pino';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { requestId } from '../src/middleware/requestId.js';

export const silentLogger = pino({ level: 'silent' });

export function testConfig(overrides = {}) {
  return loadConfig({
    NODE_ENV: 'test',
    CORS_ORIGINS: 'http://localhost:5173',
    ...overrides,
  });
}

export function memoryLogStore() {
  const requestLogs = [];
  return {
    requestLogs,
    async saveRequestLog(entry) {
      requestLogs.push(entry);
    },
  };
}

export function buildApp({ config = testConfig(), logger = silentLogger, logStore } = {}) {
  return createApp({ config, logger, logStore: logStore ?? memoryLogStore() });
}

/** A bare app for testing a single middleware together with the error handler. */
export function miniApp(setup, { logger = silentLogger } = {}) {
  const app = express();
  app.use(requestId);
  app.use(express.json());
  setup(app);
  app.use(errorHandler({ logger }));
  return app;
}
