import { z } from 'zod';

const originList = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.url({ protocol: /^https?$/ })).min(1));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGINS: originList,
  // Number of reverse proxies in front of the server (Cloudflare, load balancer).
  // Needed so the client IP used for rate limiting is the real one.
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\/\S+$/),
  MONGODB_DB_NAME: z.string().regex(/^[A-Za-z0-9_-]{1,38}$/),
});

/**
 * Validates environment variables and returns a frozen config object.
 * Error messages name the invalid variables but never echo their values.
 * The config holds secrets (the database URI), so it must never be logged.
 */
export function loadConfig(env = process.env) {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => issue.path[0]))];
    throw new Error(`Invalid or missing environment variables: ${names.join(', ')}`);
  }

  const env_ = result.data;
  return Object.freeze({
    env: env_.NODE_ENV,
    port: env_.PORT,
    logLevel: env_.LOG_LEVEL,
    corsOrigins: Object.freeze(env_.CORS_ORIGINS.map((origin) => new URL(origin).origin)),
    trustProxy: env_.TRUST_PROXY,
    rateLimit: Object.freeze({ windowMs: env_.RATE_LIMIT_WINDOW_MS, max: env_.RATE_LIMIT_MAX }),
    mongodb: Object.freeze({ uri: env_.MONGODB_URI, dbName: env_.MONGODB_DB_NAME }),
  });
}
