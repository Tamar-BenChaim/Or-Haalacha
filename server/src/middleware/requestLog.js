import { anonymizeIp } from '../lib/anonymizeIp.js';

/**
 * Records every request once the response is sent.
 * The entry holds no query string, body or headers, so no personal data is logged.
 * A failing log store never affects the response.
 */
export function requestLog({ logStore, logger }) {
  return (req, res, next) => {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      const entry = {
        timestamp: new Date(),
        requestId: req.id,
        method: req.method,
        path: req.originalUrl.split('?')[0],
        status: res.statusCode,
        durationMs: Number(process.hrtime.bigint() - startedAt) / 1e6,
        ip: anonymizeIp(req.ip),
      };

      Promise.resolve()
        .then(() => logStore.saveRequestLog(entry))
        .catch((err) => logger.error({ err, requestId: req.id }, 'failed to save request log'));
    });

    next();
  };
}
