import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function setup() {
  const server = await MongoMemoryServer.create();
  process.env.MONGODB_URI = server.getUri('hautecorner_test');
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
  process.env.GOOGLE_WEB_CLIENT_ID = 'test-web-client.apps.googleusercontent.com';
  process.env.APPLE_BUNDLE_ID = 'com.hautecorner.app';

  return async () => {
    await server.stop();
  };
}
