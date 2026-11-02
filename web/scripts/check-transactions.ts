// Proves multi-document transactions work on this cluster, which the ledger
// depends on. Uses a scratch collection and removes it. Run with: bun run check-transactions
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';

const COLLECTION = 'transaction_check';

async function main() {
  const { connection } = await dbConnect();
  const collection = connection.db!.collection(COLLECTION);
  await collection.deleteMany({});

  await connection.transaction(async (session) => {
    await collection.insertOne({ step: 'committed-a' }, { session });
    await collection.insertOne({ step: 'committed-b' }, { session });
  });
  const committed = await collection.countDocuments();

  await connection
    .transaction(async (session) => {
      await collection.insertOne({ step: 'rolled-back' }, { session });
      throw new Error('intentional rollback');
    })
    .catch((error) => {
      if (error.message !== 'intentional rollback') throw error;
    });
  const afterRollback = await collection.countDocuments();

  await collection.drop();

  if (committed !== 2 || afterRollback !== 2) {
    throw new Error(`Transaction check failed: committed=${committed}, afterRollback=${afterRollback}`);
  }
  console.log(`Transactions work on ${connection.db!.databaseName}: commit kept 2 documents, rollback added none.`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
