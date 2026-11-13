import { timingSafeEqual } from 'node:crypto';
import { ApiError } from '@/lib/http';

// Vercel Cron sends Authorization: Bearer <CRON_SECRET>.
export function requireCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  const sent = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  if (!secret || sent.length !== expected.length || !timingSafeEqual(Buffer.from(sent), Buffer.from(expected))) {
    throw new ApiError(401, 'unauthenticated', 'Not allowed');
  }
}
