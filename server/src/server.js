import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { createRepositories, ensureIndexes } from './data/index.js';
import { connectDatabase } from './data/database.js';
import { createAccessTokenVerifier, rejectAllTokens } from './lib/cloudflareAccess.js';
import { createLogger } from './lib/logger.js';
import { createMongoLogStore } from './logging/mongoLogStore.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const logger = createLogger({ level: config.logLevel });

let database;
try {
  database = await connectDatabase(config.mongodb);
} catch (err) {
  // Driver messages can include host names, so only the error type is logged.
  logger.fatal({ errorName: err.name }, 'could not connect to the database');
  process.exit(1);
}

if (config.admin.devEmail) {
  logger.warn('ADMIN_DEV_EMAIL is set: admin routes skip Cloudflare Access (development only)');
}

const repositories = createRepositories(database.db);
await ensureIndexes(repositories);

const app = createApp({
  config,
  logger,
  logStore: createMongoLogStore(repositories),
  database,
  repositories,
  verifyAccessToken: config.cloudflareAccess
    ? createAccessTokenVerifier(config.cloudflareAccess)
    : rejectAllTokens,
});

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.env }, 'server started');
});

function shutdown(signal) {
  logger.info({ signal }, 'shutting down');
  server.close(async () => {
    await database.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (err) => {
  logger.fatal({ err }, 'unhandled promise rejection');
  process.exit(1);
});
