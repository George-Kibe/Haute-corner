import { dbConnect } from '@/lib/db';
import { completeSignUp } from '@/lib/email-auth';
import { clientIp, ok, parseBody, route } from '@/lib/http';
import { limitEmailAction } from '@/lib/rate-limit';
import { sessionFor } from '@/lib/users';
import { verifyEmailBody } from '@/schemas/auth';

export const POST = route(async (request) => {
  const { email, code } = await parseBody(verifyEmailBody, request);
  await dbConnect();
  await limitEmailAction('codeChecks', email, clientIp(request));

  const user = await completeSignUp(email, code);
  return ok(await sessionFor(user));
});
