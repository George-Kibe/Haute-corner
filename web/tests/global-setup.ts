import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function setup() {
  const server = await MongoMemoryServer.create();
  process.env.MONGODB_URI = server.getUri('hautecorner_test');
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';

  return async () => {
    await server.stop();
  };
}
