import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config/env.js';

const base = {
  CORS_ORIGINS: 'http://localhost:5173',
  ADMIN_ORIGIN: 'http://localhost:5174/',
  ADMIN_EMAILS: 'Support@OrHaalacha.org, second@example.com',
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
    ['ADMIN_ORIGIN', { ADMIN_ORIGIN: undefined }],
    ['ADMIN_EMAILS', { ADMIN_EMAILS: undefined }],
    ['ADMIN_EMAILS', { ADMIN_EMAILS: 'not-an-email' }],
    ['ADMIN_DEV_EMAIL', { ADMIN_DEV_EMAIL: 'nope' }],
    ['CF_ACCESS_TEAM_DOMAIN', { CF_ACCESS_TEAM_DOMAIN: 'http://team.cloudflareaccess.com' }],
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

  it('exposes admin settings with lowercase emails', () => {
    expect(loadConfig({ ...base, ADMIN_DEV_EMAIL: 'Dev@Example.com' }).admin).toEqual({
      origin: 'http://localhost:5174',
      emails: ['support@orhaalacha.org', 'second@example.com'],
      devEmail: 'dev@example.com',
    });
  });

  it('enables Cloudflare Access only when both settings are present', () => {
    expect(loadConfig(base).cloudflareAccess).toBeNull();
    expect(
      loadConfig({
        ...base,
        CF_ACCESS_TEAM_DOMAIN: 'https://orhaalacha.cloudflareaccess.com/',
        CF_ACCESS_AUD: 'aud-tag',
      }).cloudflareAccess,
    ).toEqual({ teamDomain: 'https://orhaalacha.cloudflareaccess.com', audience: 'aud-tag' });
  });

  it('treats empty optional variables as unset', () => {
    const config = loadConfig({ ...base, ADMIN_DEV_EMAIL: '', CF_ACCESS_AUD: '' });
    expect(config.admin.devEmail).toBeNull();
  });

  describe('in production', () => {
    const production = {
      ...base,
      NODE_ENV: 'production',
      CF_ACCESS_TEAM_DOMAIN: 'https://orhaalacha.cloudflareaccess.com',
      CF_ACCESS_AUD: 'aud-tag',
    };

    it('accepts a complete configuration', () => {
      expect(loadConfig(production).env).toBe('production');
    });

    it.each(['CF_ACCESS_TEAM_DOMAIN', 'CF_ACCESS_AUD'])('requires %s', (name) => {
      expect(() => loadConfig({ ...production, [name]: undefined })).toThrow(name);
    });

    it('refuses the development admin bypass', () => {
      expect(() => loadConfig({ ...production, ADMIN_DEV_EMAIL: 'dev@example.com' })).toThrow(
        'ADMIN_DEV_EMAIL',
      );
    });
  });

  it('returns a frozen object', () => {
    expect(Object.isFrozen(loadConfig(base))).toBe(true);
  });
});
