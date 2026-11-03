import { dbConnect } from '@/lib/db';
import { ok, parseBody, route } from '@/lib/http';
import { verifyGoogleIdToken } from '@/lib/identity';
import { signIn } from '@/lib/users';
import { googleSignInBody } from '@/schemas/auth';

export const POST = route(async (request) => {
  const { idToken } = await parseBody(googleSignInBody, request);
  const identity = await verifyGoogleIdToken(idToken);

  await dbConnect();
  return ok(await signIn(identity));
});
