import { cookies } from 'next/headers';
import { z } from 'zod';
import { ADMIN_COOKIE, adminCookieOptions, signAdminToken } from '@/lib/admin-session';
import { dbConnect } from '@/lib/db';
import { ApiError, clientIp, noContent, parseBody, route } from '@/lib/http';
import { verifyGoogleIdToken } from '@/lib/identity';
import { LIMITS, rateLimit } from '@/lib/rate-limit';
import { User } from '@/models/User';

const signInBody = z.strictObject({ credential: z.string().min(1).max(4096) });

// Only the dashboard's own pages may sign in or out.
function requireSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw new ApiError(403, 'forbidden', 'Not allowed');
}

// Exchanges a Google ID token from the sign-in button for a dashboard cookie.
// Only existing accounts with the admin role get one.
export const POST = route(async (request) => {
  requireSameOrigin(request);
  await dbConnect();
  await rateLimit('adminSignIn:ip', clientIp(request), LIMITS.providerSignInPerIp);
  const { credential } = await parseBody(signInBody, request);
  const identity = await verifyGoogleIdToken(credential);

  const active = { deletedAt: { $exists: false } };
  const user =
    (await User.findOne({
      identities: { $elemMatch: { provider: 'google', providerId: identity.providerId } },
      ...active,
    }).lean()) ?? (identity.email ? await User.findOne({ email: identity.email, ...active }).lean() : null);

  if (user?.role !== 'admin') throw new ApiError(403, 'forbidden', 'This Google account is not a HauteCorner admin');

  (await cookies()).set(ADMIN_COOKIE, await signAdminToken(String(user._id)), adminCookieOptions);
  return noContent();
});

export const DELETE = route(async (request) => {
  requireSameOrigin(request);
  (await cookies()).delete(ADMIN_COOKIE);
  return noContent();
});
