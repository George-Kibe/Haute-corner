import { dbConnect } from '@/lib/db';
import { resetPassword } from '@/lib/email-auth';
import { clientIp, ok, parseBody, route } from '@/lib/http';
import { limitEmailAction } from '@/lib/rate-limit';
import { sessionFor } from '@/lib/users';
import { resetPasswordBody } from '@/schemas/auth';

// Sets the new password, signs out every other device, and signs in this one.
export const POST = route(async (request) => {
  const { email, code, password } = await parseBody(resetPasswordBody, request);
  await dbConnect();
  await limitEmailAction('codeChecks', email, clientIp(request));

  const user = await resetPassword(email, code, password);
  return ok(await sessionFor(user));
});
