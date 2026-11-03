import { revokeSession } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { noContent, parseBody, route } from '@/lib/http';
import { refreshTokenBody } from '@/schemas/auth';

// Succeeds even if the token is unknown or already revoked, so signing out never fails.
export const POST = route(async (request) => {
  const { refreshToken } = await parseBody(refreshTokenBody, request);

  await dbConnect();
  await revokeSession(refreshToken);
  return noContent();
});
