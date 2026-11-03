import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { ApiError } from '@/lib/http';
import { EmailCode, type CodePurpose } from '@/models/EmailCode';

// Recommended values: 6 digits, valid for 10 minutes, 5 tries per code, and a
// minute between emails. A pending sign-up can be resent for a day.
export const CODE_LIFETIME_SECONDS = 10 * 60;
export const RESEND_AFTER_SECONDS = 60;
const MAX_ATTEMPTS = 5;
const RECORD_LIFETIME_SECONDS = 24 * 60 * 60;

// An HMAC with a server secret, so a copy of the database alone does not
// reveal codes, even though there are only a million of them.
function hashCode(purpose: CodePurpose, email: string, code: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return createHmac('sha256', secret).update(`${purpose}:${email}:${code}`).digest('hex');
}

const invalidCode = (message: string) => new ApiError(400, 'invalid_code', message);

// Creates or replaces the code for this address and purpose, and returns it to be emailed.
export async function issueCode(
  email: string,
  purpose: CodePurpose,
  pending: { name?: string; passwordHash?: string } = {},
) {
  const existing = await EmailCode.findOne({ email, purpose }).lean();
  const now = Date.now();
  const nextAllowed = existing ? existing.sentAt.getTime() + RESEND_AFTER_SECONDS * 1000 : 0;
  if (now < nextAllowed) {
    const wait = Math.ceil((nextAllowed - now) / 1000);
    throw new ApiError(429, 'rate_limited', `Please wait ${wait} seconds before asking for another code`, undefined, {
      'Retry-After': String(wait),
    });
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await EmailCode.updateOne(
    { email, purpose },
    {
      $set: {
        codeHash: hashCode(purpose, email, code),
        codeExpiresAt: new Date(now + CODE_LIFETIME_SECONDS * 1000),
        attempts: 0,
        sentAt: new Date(now),
        expiresAt: new Date(now + RECORD_LIFETIME_SECONDS * 1000),
        ...pending,
      },
    },
    { upsert: true },
  );
  return code;
}

// What a pending sign-up stored, so a new code can be sent without the password again.
export function findPending(email: string, purpose: CodePurpose) {
  return EmailCode.findOne({ email, purpose }).lean();
}

// Checks a code and uses it up. Each wrong try counts, and a code stops
// working after 5 tries or 10 minutes. Returns what was stored with it.
export async function consumeCode(email: string, purpose: CodePurpose, code: string) {
  const record = await EmailCode.findOneAndUpdate(
    { email, purpose, codeExpiresAt: { $gt: new Date() }, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { returnDocument: 'after' },
  ).lean();
  if (!record) throw invalidCode('This code has expired. Ask for a new one');

  const expected = Buffer.from(record.codeHash, 'hex');
  const actual = Buffer.from(hashCode(purpose, email, code), 'hex');
  if (!timingSafeEqual(expected, actual)) {
    const left = MAX_ATTEMPTS - record.attempts;
    throw invalidCode(
      left > 0 ? `That code is not right. ${left} ${left === 1 ? 'try' : 'tries'} left` : 'That code is not right. Ask for a new one',
    );
  }

  // Only one request can use a code, even if two arrive at once.
  const { deletedCount } = await EmailCode.deleteOne({ _id: record._id, codeHash: record.codeHash });
  if (deletedCount !== 1) throw invalidCode('This code has already been used. Ask for a new one');
  return record;
}
