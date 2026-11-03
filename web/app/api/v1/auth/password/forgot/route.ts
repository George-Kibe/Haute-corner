import { dbConnect } from '@/lib/db';
import { requestPasswordReset } from '@/lib/email-auth';
import { clientIp, ok, parseBody, route } from '@/lib/http';
import { CODE_LIFETIME_SECONDS, RESEND_AFTER_SECONDS } from '@/lib/one-time-codes';
import { limitEmailAction } from '@/lib/rate-limit';
import { forgotPasswordBody } from '@/schemas/auth';

// Answers the same whether or not an account uses this address.
export const POST = route(async (request) => {
  const { email } = await parseBody(forgotPasswordBody, request);
  await dbConnect();
  await limitEmailAction('codeEmails', email, clientIp(request));

  await requestPasswordReset(email);
  return ok(
    { email, expiresInSeconds: CODE_LIFETIME_SECONDS, resendAfterSeconds: RESEND_AFTER_SECONDS },
    { status: 202 },
  );
});
