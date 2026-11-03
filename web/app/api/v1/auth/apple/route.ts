import { dbConnect } from '@/lib/db';
import { ok, parseBody, route } from '@/lib/http';
import { verifyAppleIdentityToken } from '@/lib/identity';
import { signIn } from '@/lib/users';
import { appleSignInBody } from '@/schemas/auth';

export const POST = route(async (request) => {
  const { identityToken, fullName } = await parseBody(appleSignInBody, request);
  const identity = await verifyAppleIdentityToken(identityToken);
  const name = [fullName?.givenName, fullName?.familyName].filter(Boolean).join(' ') || undefined;

  await dbConnect();
  return ok(await signIn(identity, name));
});
