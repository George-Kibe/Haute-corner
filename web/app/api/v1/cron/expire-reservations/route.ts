import { requireCron } from '@/lib/cron';
import { dbConnect } from '@/lib/db';
import { ok, route } from '@/lib/http';
import { expireReservations } from '@/lib/payments';

export const maxDuration = 60;

export const GET = route(async (request) => {
  requireCron(request);
  await dbConnect();
  return ok({ expired: await expireReservations() });
});
