import { attachDatabasePool } from '@vercel/functions';
import mongoose from 'mongoose';

let connecting: Promise<typeof mongoose> | null = null;

export async function dbConnect() {
  if (mongoose.connection.readyState === 1) return mongoose;

  if (!connecting) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set');

    connecting = mongoose
      .connect(uri, {
        bufferCommands: false,
        minPoolSize: 1,
        maxPoolSize: 10,
        maxIdleTimeMS: 5000,
        serverSelectionTimeoutMS: 5000,
        autoIndex: process.env.NODE_ENV !== 'production',
      })
      .then((connected) => {
        attachDatabasePool(connected.connection.getClient());
        return connected;
      })
      .finally(() => {
        connecting = null;
      });
  }

  return connecting;
}
