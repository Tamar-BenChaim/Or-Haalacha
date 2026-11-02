import { z } from 'zod';

const listOf = (item) =>
  z
    .string()
    .transform((value) =>
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
    )
    .pipe(z.array(item).min(1));

const httpUrl = z.url({ protocol: /^https?$/ });
const optional = (schema) => z.preprocess((value) => (value === '' ? undefined : value), schema);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    // Browser origins of the store; the admin app has its own origin below.
    CORS_ORIGINS: listOf(httpUrl),
    ADMIN_ORIGIN: httpUrl,
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
    ADMIN_EMAILS: listOf(z.email()),
    CF_ACCESS_TEAM_DOMAIN: optional(z.url({ protocol: /^https$/ }).optional()),
    CF_ACCESS_AUD: optional(z.string().min(1).optional()),
    // Development only: treats every admin request as this admin, without Cloudflare Access.
    ADMIN_DEV_EMAIL: optional(z.email().optional()),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    for (const name of ['CF_ACCESS_TEAM_DOMAIN', 'CF_ACCESS_AUD']) {
      if (!env[name]) ctx.addIssue({ code: 'custom', path: [name], message: 'Required' });
    }
    if (env.ADMIN_DEV_EMAIL) {
      ctx.addIssue({ code: 'custom', path: ['ADMIN_DEV_EMAIL'], message: 'Not allowed' });
    }
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
  const toOrigin = (url) => new URL(url).origin;
  return Object.freeze({
    env: env_.NODE_ENV,
    port: env_.PORT,
    logLevel: env_.LOG_LEVEL,
    corsOrigins: Object.freeze(env_.CORS_ORIGINS.map(toOrigin)),
    trustProxy: env_.TRUST_PROXY,
    rateLimit: Object.freeze({ windowMs: env_.RATE_LIMIT_WINDOW_MS, max: env_.RATE_LIMIT_MAX }),
    mongodb: Object.freeze({ uri: env_.MONGODB_URI, dbName: env_.MONGODB_DB_NAME }),
    admin: Object.freeze({
      origin: toOrigin(env_.ADMIN_ORIGIN),
      emails: Object.freeze(env_.ADMIN_EMAILS.map((email) => email.toLowerCase())),
      devEmail: env_.ADMIN_DEV_EMAIL?.toLowerCase() ?? null,
    }),
    cloudflareAccess:
      env_.CF_ACCESS_TEAM_DOMAIN && env_.CF_ACCESS_AUD
        ? Object.freeze({
            teamDomain: toOrigin(env_.CF_ACCESS_TEAM_DOMAIN),
            audience: env_.CF_ACCESS_AUD,
          })
        : null,
  });
}
