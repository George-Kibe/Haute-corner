// Removes the sample sellers and products that seed added, leaving everything else.
//
//   bun run remove-samples                                         the database in .env.local
//   MONGODB_URI=... bun run remove-samples --confirm=<database>    any other database
//
// Add --media to also delete the sample photos from Cloudinary. Do that last, once no
// database uses them, because the dev and production samples share the same photos.
import mongoose from 'mongoose';
import { cloudinaryAccount } from '@/lib/cloudinary';
import { dbConnect } from '@/lib/db';
import { removeSampleBatch, requireConfirmation } from './sample-batch';
import { SAMPLE_TAG } from './sample-catalogue';

async function deleteSamplePhotos() {
  const { cloudName, apiKey, apiSecret } = cloudinaryAccount();
  const auth = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;
  let deleted = 0;

  // Cloudinary deletes up to 1000 assets per call, and says when there are more.
  for (;;) {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image/tags/${SAMPLE_TAG}`, {
      method: 'DELETE',
      headers: { Authorization: auth },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(`Deleting photos failed: ${result.error?.message ?? response.status}`);
    deleted += Object.values(result.deleted ?? {}).filter((status) => status === 'deleted').length;
    if (!result.partial) break;
  }
  console.log(`Deleted ${deleted} sample photos from ${cloudName}.`);
}

async function main() {
  const { connection } = await dbConnect();
  const databaseName = connection.db!.databaseName;
  requireConfirmation(databaseName, 'remove samples from it');

  const removed = await removeSampleBatch(connection);
  console.log(
    removed
      ? `Removed ${removed.sellers} sample sellers and ${removed.products} products from ${databaseName}.`
      : `No sample batch found in ${databaseName}.`,
  );

  if (process.argv.includes('--media')) await deleteSamplePhotos();
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
