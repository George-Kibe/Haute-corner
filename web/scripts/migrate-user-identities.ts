// One-off: moves users from a single provider and providerId to a list of
// identities, so one account can link Google, Apple and email. Safe to run again.
//
//   bun run migrate-user-identities                                       .env.local
//   MONGODB_URI=... bun run migrate-user-identities --confirm=<database>  any other database
//
// Run sync-indexes afterwards, which drops the old provider index.
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';
import { requireConfirmation } from './sample-batch';

type LegacyUser = { _id: mongoose.Types.ObjectId; provider?: string; providerId?: string; deletedAt?: Date };

async function main() {
  const { connection } = await dbConnect();
  const databaseName = connection.db!.databaseName;
  requireConfirmation(databaseName, 'migrate it');

  const users = connection.db!.collection<LegacyUser>('users');
  let moved = 0;
  for await (const user of users.find({ provider: { $exists: true } })) {
    const deleted = !!user.deletedAt || user.providerId?.startsWith('deleted:');
    await users.updateOne(
      { _id: user._id },
      {
        $set: { identities: deleted ? [] : [{ provider: user.provider, providerId: user.providerId }] },
        $unset: { provider: '', providerId: '' },
      },
    );
    moved++;
  }

  console.log(`Moved ${moved} users to identities in ${databaseName}.`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
