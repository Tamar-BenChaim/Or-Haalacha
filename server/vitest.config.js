import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    globalSetup: ['test/setup/mongo.js'],
    hookTimeout: 30_000,
  },
});
