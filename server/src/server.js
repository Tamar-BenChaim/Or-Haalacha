import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { createLogger } from './lib/logger.js';
import { createStdoutLogStore } from './logging/stdoutLogStore.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const logger = createLogger({ level: config.logLevel });
const app = createApp({ config, logger, logStore: createStdoutLogStore(logger) });

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.env }, 'server started');
});

function shutdown(signal) {
  logger.info({ signal }, 'shutting down');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (err) => {
  logger.fatal({ err }, 'unhandled promise rejection');
  process.exit(1);
});
