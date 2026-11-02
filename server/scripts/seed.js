// Fills the development database with sample content: npm run seed
import { loadConfig } from '../src/config/env.js';
import { connectDatabase } from '../src/data/database.js';
import { createRepositories, ensureIndexes } from '../src/data/index.js';
import { seedSampleData } from '../src/data/seed.js';

const config = loadConfig();

if (config.env === 'production' || /prod/i.test(config.mongodb.dbName)) {
  console.error('Refusing to seed a production database.');
  process.exit(1);
}

const database = await connectDatabase(config.mongodb);
try {
  const repositories = createRepositories(database.db);
  await ensureIndexes(repositories);
  const counts = await seedSampleData(repositories);
  console.log(
    `Seeded ${counts.books} books and ${counts.bundles} bundles into "${config.mongodb.dbName}".`,
  );
} finally {
  await database.close();
}
