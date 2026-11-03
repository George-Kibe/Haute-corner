// Adds the sample catalogue from sample-catalogue.ts, copying its photos into our Cloudinary account.
//
//   bun run seed                                         the database in .env.local, ending in _dev
//   MONGODB_URI=... bun run seed --confirm=<database>    any other database
//
// On a database ending in _dev, all products and sellers are replaced. Anywhere else, only the
// previous sample batch is replaced. Remove the samples again with remove-samples.
import mongoose, { Types } from 'mongoose';
import { cloudinaryAccount, signParams, type CloudinaryAccount } from '@/lib/cloudinary';
import { dbConnect } from '@/lib/db';
import { Product, type Media } from '@/models/Product';
import { Seller } from '@/models/Seller';
import { recordSamples, removeSampleBatch, requireConfirmation, startSampleBatch } from './sample-batch';
import { SAMPLE_CATALOGUE, SAMPLE_FOLDER, SAMPLE_IMAGES, SAMPLE_TAG, type SampleImage } from './sample-catalogue';

// Copies a sample photo into our account. An existing copy is kept rather than overwritten.
async function uploadImage(account: CloudinaryAccount, key: SampleImage): Promise<Media> {
  const source = SAMPLE_IMAGES[key];
  const sourceCloud = source.cloud === 'own' ? account.cloudName : 'demo';
  const params = {
    asset_folder: SAMPLE_FOLDER,
    overwrite: 'false',
    public_id: `${SAMPLE_FOLDER}/${key}`,
    tags: SAMPLE_TAG,
    timestamp: Math.floor(Date.now() / 1000),
  };

  const body = new FormData();
  for (const [name, value] of Object.entries(params)) body.set(name, String(value));
  body.set('file', `https://res.cloudinary.com/${sourceCloud}/image/upload/${source.publicId}`);
  body.set('api_key', account.apiKey);
  body.set('signature', signParams(params, account.apiSecret));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${account.cloudName}/image/upload`, {
    method: 'POST',
    body,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`Copying ${key} failed: ${result.error?.message ?? response.status}`);
  return { kind: 'image', publicId: result.public_id, width: result.width, height: result.height };
}

async function main() {
  const account = cloudinaryAccount();
  const { connection } = await dbConnect();
  const databaseName = connection.db!.databaseName;
  requireConfirmation(databaseName, 'seed it');

  if (process.env.CLOUDINARY_CLOUD_NAME !== account.cloudName) {
    console.warn(
      `Warning: CLOUDINARY_CLOUD_NAME is "${process.env.CLOUDINARY_CLOUD_NAME}", but the photos are in "${account.cloudName}". ` +
        'The app will not show them until the API reports the same cloud.',
    );
  }

  const keys = [...new Set(SAMPLE_CATALOGUE.flatMap(({ products }) => products.flatMap((product) => product.images)))];
  const media = new Map<SampleImage, Media>();
  for (const key of keys) media.set(key, await uploadImage(account, key));
  console.log(`${media.size} photos are in ${account.cloudName}, folder ${SAMPLE_FOLDER}.`);

  await Promise.all([Product.init(), Seller.init()]);
  if (databaseName.endsWith('_dev')) {
    await Promise.all([Product.deleteMany({}), Seller.deleteMany({})]);
  }
  const removed = await removeSampleBatch(connection);
  if (removed) console.log(`Removed the previous batch: ${removed.sellers} sellers and ${removed.products} products.`);

  await startSampleBatch(connection);
  let productCount = 0;
  for (const { seller, products } of SAMPLE_CATALOGUE) {
    const createdSeller = await Seller.create({
      ...seller,
      userId: new Types.ObjectId(),
      status: 'approved',
      phone: '+254700000000',
      payoutMpesaNumber: '+254700000000',
    });
    const createdProducts = await Product.insertMany(
      products.map(({ images, ...product }) => ({
        ...product,
        sellerId: createdSeller._id,
        media: images.map((key) => media.get(key)!),
      })),
    );
    await recordSamples(
      connection,
      createdSeller._id,
      createdProducts.map((product) => product._id),
    );
    productCount += createdProducts.length;
  }

  console.log(`Seeded ${SAMPLE_CATALOGUE.length} sellers and ${productCount} products into ${databaseName}.`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
