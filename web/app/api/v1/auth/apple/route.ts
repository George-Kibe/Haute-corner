import { dbConnect } from '@/lib/db';
import { clientIp, ok, parseBody, route } from '@/lib/http';
import { verifyAppleIdentityToken } from '@/lib/identity';
import { LIMITS, rateLimit } from '@/lib/rate-limit';
import { signInWithIdentity } from '@/lib/users';
import { appleSignInBody } from '@/schemas/auth';

export const POST = route(async (request) => {
  const { identityToken, fullName } = await parseBody(appleSignInBody, request);
  await dbConnect();
  await rateLimit('provider-sign-in:ip', clientIp(request), LIMITS.providerSignInPerIp);

  const identity = await verifyAppleIdentityToken(identityToken);
  const name = [fullName?.givenName, fullName?.familyName].filter(Boolean).join(' ') || undefined;
  return ok(await signInWithIdentity(identity, name));
});
