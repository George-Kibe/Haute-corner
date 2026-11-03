import { dbConnect } from '@/lib/db';
import { signInWithPassword } from '@/lib/email-auth';
import { clientIp, ok, parseBody, route } from '@/lib/http';
import { limitEmailAction } from '@/lib/rate-limit';
import { sessionFor } from '@/lib/users';
import { passwordSignInBody } from '@/schemas/auth';

export const POST = route(async (request) => {
  const { email, password } = await parseBody(passwordSignInBody, request);
  await dbConnect();
  await limitEmailAction('passwordSignIn', email, clientIp(request));

  const user = await signInWithPassword(email, password);
  return ok(await sessionFor(user));
});
