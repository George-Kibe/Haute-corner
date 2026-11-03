import { createHash } from 'node:crypto';
import { ApiError } from '@/lib/http';
import { RateLimit } from '@/models/RateLimit';

export type Limit = { limit: number; windowSeconds: number };

// Recommended starting values. Per-address limits are high because carriers
// put many phones behind one address.
export const LIMITS = {
  providerSignInPerIp: { limit: 60, windowSeconds: 10 * 60 },
  passwordSignInPerEmail: { limit: 10, windowSeconds: 15 * 60 },
  passwordSignInPerIp: { limit: 100, windowSeconds: 15 * 60 },
  codeEmailsPerEmail: { limit: 5, windowSeconds: 60 * 60 },
  codeEmailsPerIp: { limit: 30, windowSeconds: 60 * 60 },
  codeChecksPerEmail: { limit: 10, windowSeconds: 15 * 60 },
  codeChecksPerIp: { limit: 100, windowSeconds: 15 * 60 },
} satisfies Record<string, Limit>;

type EmailAction = 'codeEmails' | 'codeChecks' | 'passwordSignIn';

// Limits an action on one email address, and from one network address.
export async function limitEmailAction(action: EmailAction, email: string, ip: string) {
  await rateLimit(`${action}:email`, email, LIMITS[`${action}PerEmail`]);
  await rateLimit(`${action}:ip`, ip, LIMITS[`${action}PerIp`]);
}

// Counts a request against a fixed window, and refuses it with 429 once the
// window is full. Keys such as email addresses are hashed before storage.
export async function rateLimit(bucket: string, key: string, { limit, windowSeconds }: Limit) {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  const windowEnd = windowStart + windowSeconds;
  const hashedKey = createHash('sha256').update(key).digest('base64url').slice(0, 24);

  const counter = await RateLimit.findOneAndUpdate(
    { _id: `${bucket}:${hashedKey}:${windowStart}` },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowEnd * 1000) } },
    { upsert: true, returnDocument: 'after' },
  ).lean();

  if (counter!.count > limit) {
    throw new ApiError(429, 'rate_limited', 'Too many attempts. Please wait a few minutes and try again', undefined, {
      'Retry-After': String(windowEnd - now),
    });
  }
}
