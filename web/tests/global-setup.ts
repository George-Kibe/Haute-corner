import { randomBytes } from 'node:crypto';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

export default async function setup() {
  // A one-node replica set, because checkout and the ledger use transactions.
  const server = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  process.env.MONGODB_URI = server.getUri('hautecorner_test');
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_URL = 'cloudinary://test-key:test-secret@test-cloud';
  // Random each run, so no signing secret is written in the repository.
  process.env.JWT_SECRET = randomBytes(32).toString('hex');
  process.env.GOOGLE_WEB_CLIENT_ID = 'test-web-client.apps.googleusercontent.com';
  process.env.APPLE_BUNDLE_ID = 'com.hautecorner.app';
  process.env.EMAIL_TRANSPORT = 'memory';

  return async () => {
    await server.stop();
  };
}
