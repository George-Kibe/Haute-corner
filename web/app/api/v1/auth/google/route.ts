import { dbConnect } from '@/lib/db';
import { clientIp, ok, parseBody, route } from '@/lib/http';
import { verifyGoogleIdToken } from '@/lib/identity';
import { LIMITS, rateLimit } from '@/lib/rate-limit';
import { signInWithIdentity } from '@/lib/users';
import { googleSignInBody } from '@/schemas/auth';

export const POST = route(async (request) => {
  const { idToken } = await parseBody(googleSignInBody, request);
  await dbConnect();
  await rateLimit('provider-sign-in:ip', clientIp(request), LIMITS.providerSignInPerIp);

  const identity = await verifyGoogleIdToken(idToken);
  return ok(await signInWithIdentity(identity));
});
