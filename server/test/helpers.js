import { randomUUID } from 'node:crypto';
import express from 'express';
import pino from 'pino';
import { afterAll, beforeAll, inject } from 'vitest';
import { createApp } from '../src/app.js';
import { rejectAllTokens } from '../src/lib/cloudflareAccess.js';
import { loadConfig } from '../src/config/env.js';
import { connectDatabase } from '../src/data/database.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { requestId } from '../src/middleware/requestId.js';

export const silentLogger = pino({ level: 'silent' });

export function testConfig(overrides = {}) {
  return loadConfig({
    NODE_ENV: 'test',
    CORS_ORIGINS: 'http://localhost:5173',
    ADMIN_ORIGIN: 'http://localhost:5174',
    ADMIN_EMAILS: 'support@orhaalacha.org',
    MONGODB_URI: 'mongodb://localhost:27017',
    MONGODB_DB_NAME: 'test',
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

export const healthyDatabase = { ping: async () => {} };

export const emptyRepositories = {
  books: {
    findVisible: async () => [],
    findVisibleBySlug: async () => null,
    findVisibleBySlugs: async () => [],
  },
  bundles: { findVisible: async () => [], findVisibleBySlugs: async () => [] },
  auditLogs: { insert: async () => {} },
};

export const ADMIN_EMAIL = 'support@orhaalacha.org';

/**
 * Stands in for Cloudflare's signature check in route tests (the real check is
 * covered in cloudflareAccess.test.js): "admin-token" belongs to the admin,
 * "stranger-token" to an email that is not allowed, anything else is invalid.
 */
export async function fakeVerifyAccessToken(token) {
  if (token === 'admin-token') return { email: ADMIN_EMAIL };
  if (token === 'stranger-token') return { email: 'someone@example.com' };
  throw Object.assign(new Error('invalid token'), { code: 'ERR_JWS_INVALID' });
}

export function buildApp({
  config = testConfig(),
  logger = silentLogger,
  logStore = memoryLogStore(),
  database = healthyDatabase,
  repositories = emptyRepositories,
  verifyAccessToken = rejectAllTokens,
} = {}) {
  return createApp({ config, logger, logStore, database, repositories, verifyAccessToken });
}

/**
 * Connects to the test MongoDB with a database unique to the calling test file,
 * and drops it afterwards. Returns a getter for the connected database.
 */
export function useTestDatabase() {
  let database;

  beforeAll(async () => {
    database = await connectDatabase({
      uri: inject('mongoUri'),
      dbName: `test_${randomUUID().slice(0, 8)}`,
    });
  });

  afterAll(async () => {
    await database?.db.dropDatabase();
    await database?.close();
  });

  return () => database;
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
