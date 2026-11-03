import { randomBytes } from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function setup() {
  const server = await MongoMemoryServer.create();
  process.env.MONGODB_URI = server.getUri('hautecorner_test');
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  // Random each run, so no signing secret is written in the repository.
  process.env.JWT_SECRET = randomBytes(32).toString('hex');
  process.env.GOOGLE_WEB_CLIENT_ID = 'test-web-client.apps.googleusercontent.com';
  process.env.APPLE_BUNDLE_ID = 'com.hautecorner.app';

  return async () => {
    await server.stop();
  };
}
