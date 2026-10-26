import pino from 'pino';

export function createLogger({ level }) {
  return pino({
    level,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["cf-access-jwt-assertion"]',
        '*.password',
        '*.token',
      ],
      censor: '[redacted]',
    },
  });
}
