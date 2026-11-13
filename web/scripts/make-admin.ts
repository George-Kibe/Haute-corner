// Gives an existing account the admin role, so it can sign in to /admin.
// Usage: bun run make-admin --email=you@example.com [--revoke]
// A database not ending in _dev also needs --confirm=<database name>.
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';
import { User } from '@/models/User';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value ?? 'true'];
  }),
);

async function main() {
  const email = args.email?.toLowerCase();
  if (!email) throw new Error('Pass --email=<address of an existing account>');
  await dbConnect();
  const database = mongoose.connection.db!.databaseName;
  if (!database.endsWith('_dev') && args.confirm !== database) {
    throw new Error(`This is ${database}. Run again with --confirm=${database} to change it.`);
  }
  const role = args.revoke ? 'customer' : 'admin';
  const user = await User.findOneAndUpdate({ email, deletedAt: { $exists: false } }, { $set: { role } }, { returnDocument: 'after' });
  if (!user) throw new Error(`No account uses ${email}. Sign in to the app once first.`);
  console.log(`${email} on ${database} is now ${role}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
