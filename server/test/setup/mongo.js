import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Provides a MongoDB URI to the tests: MONGODB_TEST_URI when set (e.g. a local
 * container), otherwise an in-memory MongoDB started for the test run.
 */
export default async function setup(project) {
  if (process.env.MONGODB_TEST_URI) {
    project.provide('mongoUri', process.env.MONGODB_TEST_URI);
    return;
  }

  const server = await MongoMemoryServer.create();
  project.provide('mongoUri', server.getUri());
  return () => server.stop();
}
