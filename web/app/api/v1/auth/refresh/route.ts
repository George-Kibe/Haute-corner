import { rotateSession } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { ok, parseBody, route } from '@/lib/http';
import { refreshTokenBody } from '@/schemas/auth';

export const POST = route(async (request) => {
  const { refreshToken } = await parseBody(refreshTokenBody, request);

  await dbConnect();
  return ok(await rotateSession(refreshToken));
});
