import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config/env.js';

const base = {
  CORS_ORIGINS: 'http://localhost:5173',
  MONGODB_URI: 'mongodb+srv://user:pass@cluster.example.net/',
  MONGODB_DB_NAME: 'or-haalacha-dev',
};

describe('loadConfig', () => {
  it('applies defaults', () => {
    const config = loadConfig(base);
    expect(config).toMatchObject({
      env: 'development',
      port: 3000,
      logLevel: 'info',
      trustProxy: 0,
      rateLimit: { windowMs: 900000, max: 300 },
    });
  });

  it('parses a comma-separated origin list and normalizes each origin', () => {
    const config = loadConfig({
      ...base,
      CORS_ORIGINS: ' https://orhaalacha.org/ , https://admin.orhaalacha.org ',
    });
    expect(config.corsOrigins).toEqual(['https://orhaalacha.org', 'https://admin.orhaalacha.org']);
  });

  it('coerces numeric variables', () => {
    const config = loadConfig({ ...base, PORT: '8080', TRUST_PROXY: '2' });
    expect(config.port).toBe(8080);
    expect(config.trustProxy).toBe(2);
  });

  it.each([
    ['CORS_ORIGINS', { CORS_ORIGINS: undefined }],
    ['CORS_ORIGINS', { CORS_ORIGINS: 'not-a-url' }],
    ['CORS_ORIGINS', { CORS_ORIGINS: 'ftp://example.com' }],
    ['PORT', { PORT: '70000' }],
    ['NODE_ENV', { NODE_ENV: 'staging' }],
    ['MONGODB_URI', { MONGODB_URI: undefined }],
    ['MONGODB_URI', { MONGODB_URI: 'http://cluster.example.net' }],
    ['MONGODB_DB_NAME', { MONGODB_DB_NAME: undefined }],
    ['MONGODB_DB_NAME', { MONGODB_DB_NAME: 'bad name' }],
  ])('rejects an invalid %s', (name, overrides) => {
    expect(() => loadConfig({ ...base, ...overrides })).toThrow(name);
  });

  it('does not echo invalid values in the error message', () => {
    expect(() => loadConfig({ ...base, MONGODB_URI: 'secret-looking-value' })).toThrow(
      /^((?!secret-looking-value).)*$/,
    );
  });

  it('exposes the database settings', () => {
    expect(loadConfig(base).mongodb).toEqual({
      uri: 'mongodb+srv://user:pass@cluster.example.net/',
      dbName: 'or-haalacha-dev',
    });
  });

  it('returns a frozen object', () => {
    expect(Object.isFrozen(loadConfig(base))).toBe(true);
  });
});
