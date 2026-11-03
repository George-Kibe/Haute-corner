import { dbConnect } from '@/lib/db';
import { requestPasswordReset, resendSignUpCode } from '@/lib/email-auth';
import { clientIp, ok, parseBody, route } from '@/lib/http';
import { CODE_LIFETIME_SECONDS, RESEND_AFTER_SECONDS } from '@/lib/one-time-codes';
import { limitEmailAction } from '@/lib/rate-limit';
import { resendCodeBody } from '@/schemas/auth';

export const POST = route(async (request) => {
  const { email, purpose } = await parseBody(resendCodeBody, request);
  await dbConnect();
  await limitEmailAction('codeEmails', email, clientIp(request));

  if (purpose === 'signup') await resendSignUpCode(email);
  else await requestPasswordReset(email);

  return ok(
    { email, expiresInSeconds: CODE_LIFETIME_SECONDS, resendAfterSeconds: RESEND_AFTER_SECONDS },
    { status: 202 },
  );
});
