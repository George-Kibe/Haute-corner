import { dbConnect } from '@/lib/db';
import { startSignUp } from '@/lib/email-auth';
import { clientIp, ok, parseBody, route } from '@/lib/http';
import { CODE_LIFETIME_SECONDS, RESEND_AFTER_SECONDS } from '@/lib/one-time-codes';
import { limitEmailAction } from '@/lib/rate-limit';
import { signUpBody } from '@/schemas/auth';

// Emails a code. The account is created only when the code comes back.
export const POST = route(async (request) => {
  const body = await parseBody(signUpBody, request);
  await dbConnect();
  await limitEmailAction('codeEmails', body.email, clientIp(request));

  await startSignUp(body);
  return ok(
    { email: body.email, expiresInSeconds: CODE_LIFETIME_SECONDS, resendAfterSeconds: RESEND_AFTER_SECONDS },
    { status: 202 },
  );
});
