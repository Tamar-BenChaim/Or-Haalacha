/**
 * Log store that writes entries to the application logger (stdout).
 * Used until the database store is added; any store exposes the same methods.
 */
export function createStdoutLogStore(logger) {
  return {
    async saveRequestLog(entry) {
      logger.info({ type: 'request', ...entry }, 'request completed');
    },
  };
}
