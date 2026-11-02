// Creates the indexes in the models. Production has autoIndex off, so run this
// deliberately when indexes change: MONGODB_URI=... bun run sync-indexes
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';
import { Product } from '@/models/Product';
import { Seller } from '@/models/Seller';

async function main() {
  const { connection } = await dbConnect();

  for (const model of [Seller, Product]) {
    await model.createCollection();
    const dropped = await model.syncIndexes();
    const indexes = await model.listIndexes();
    console.log(`${model.modelName}: ${indexes.length} indexes, dropped ${dropped.length}`);
  }

  console.log(`Synced indexes on ${connection.db!.databaseName}.`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
