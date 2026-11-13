// Creates the indexes in the models. Production has autoIndex off, so run this
// deliberately when indexes change: MONGODB_URI=... bun run sync-indexes
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';
import { EmailCode } from '@/models/EmailCode';
import { LedgerEntry } from '@/models/LedgerEntry';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { Purchase } from '@/models/Purchase';
import { RateLimit } from '@/models/RateLimit';
import { Report } from '@/models/Report';
import { Seller } from '@/models/Seller';
import { Session } from '@/models/Session';
import { User } from '@/models/User';
import { WebhookEvent } from '@/models/WebhookEvent';

async function main() {
  const { connection } = await dbConnect();

  // Checkout and the ledger write inside transactions, so their collections
  // must exist beforehand.
  const models = [Seller, Product, User, Session, EmailCode, RateLimit, AuditLog, Report, Purchase, Order, LedgerEntry, WebhookEvent];
  for (const model of models as (typeof Seller)[]) {
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
