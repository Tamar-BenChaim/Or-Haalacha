import { MongoClient } from 'mongodb';

/** Connects to MongoDB and fails fast if the server cannot be reached. */
export async function connectDatabase({ uri, dbName, serverSelectionTimeoutMS = 5000 }) {
  const client = new MongoClient(uri, {
    appName: 'or-haalacha-server',
    serverSelectionTimeoutMS,
  });
  await client.connect();
  const db = client.db(dbName);

  return {
    db,
    async ping() {
      await db.command({ ping: 1 });
    },
    close: () => client.close(),
  };
}
