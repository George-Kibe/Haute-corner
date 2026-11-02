import { dbConnect } from '@/lib/db';
import { fail, ok, route } from '@/lib/http';

export const GET = route(async () => {
  try {
    const mongoose = await dbConnect();
    await mongoose.connection.db!.admin().ping();
  } catch (error) {
    console.error('Health check failed', error);
    return fail(503, 'service_unavailable', 'The database is not reachable');
  }

  return ok({ status: 'ok', database: 'reachable' });
});
