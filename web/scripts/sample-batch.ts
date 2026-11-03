// Tracks which sellers and products seed created, so that they can be removed
// later without touching anything else in the database.
import type { Connection, Types } from 'mongoose';
import { Product } from '@/models/Product';
import { Seller } from '@/models/Seller';

const BATCH_ID = 'catalogue';

type SampleBatch = {
  _id: string;
  sellerIds: Types.ObjectId[];
  productIds: Types.ObjectId[];
  createdAt: Date;
};

export function sampleBatches(connection: Connection) {
  return connection.db!.collection<SampleBatch>('samplebatches');
}

export async function startSampleBatch(connection: Connection) {
  await sampleBatches(connection).insertOne({ _id: BATCH_ID, sellerIds: [], productIds: [], createdAt: new Date() });
}

export async function recordSamples(connection: Connection, sellerId: Types.ObjectId, productIds: Types.ObjectId[]) {
  await sampleBatches(connection).updateOne(
    { _id: BATCH_ID },
    { $push: { sellerIds: sellerId, productIds: { $each: productIds } } },
  );
}

// Removes the recorded sellers, their products and the record itself. Returns null if there is no batch.
export async function removeSampleBatch(connection: Connection) {
  const batches = sampleBatches(connection);
  const batch = await batches.findOne({ _id: BATCH_ID });
  if (!batch) return null;

  const products = await Product.deleteMany({
    $or: [{ _id: { $in: batch.productIds } }, { sellerId: { $in: batch.sellerIds } }],
  });
  const sellers = await Seller.deleteMany({ _id: { $in: batch.sellerIds } });
  await batches.deleteOne({ _id: BATCH_ID });
  return { products: products.deletedCount, sellers: sellers.deletedCount };
}

// Scripts that change data only run on a database ending in _dev, unless the
// command names the database: --confirm=<database name>.
export function requireConfirmation(databaseName: string, action: string) {
  if (databaseName.endsWith('_dev')) return;
  const confirmed = process.argv.find((arg) => arg.startsWith('--confirm='))?.slice('--confirm='.length);
  if (confirmed !== databaseName) {
    throw new Error(`"${databaseName}" is not a development database. To ${action} anyway, add --confirm=${databaseName}.`);
  }
}
