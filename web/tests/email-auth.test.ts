import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as googleSignIn } from '@/app/api/v1/auth/google/route';
import { POST as appleSignIn } from '@/app/api/v1/auth/apple/route';
import { POST as resend } from '@/app/api/v1/auth/email/resend/route';
import { POST as passwordSignIn } from '@/app/api/v1/auth/email/sign-in/route';
import { POST as signUp } from '@/app/api/v1/auth/email/signup/route';
import { POST as verify } from '@/app/api/v1/auth/email/verify/route';
import { POST as forgot } from '@/app/api/v1/auth/password/forgot/route';
import { POST as reset } from '@/app/api/v1/auth/password/reset/route';
import { POST as refresh } from '@/app/api/v1/auth/refresh/route';
import { sentEmails } from '@/lib/mail';
import { hashPassword, verifyPassword } from '@/lib/passwords';
import { EmailCode } from '@/models/EmailCode';
import { User } from '@/models/User';
import { lastCodeSentTo, noParams, request, resetDatabase } from './helpers';

vi.mock('@/lib/identity', () => ({
  verifyGoogleIdToken: vi.fn(async (email: string) => ({
    provider: 'google',
    providerId: `google-${email}`,
    email,
    name: 'Google Name',
  })),
  verifyAppleIdentityToken: vi.fn(async (email: string) => ({ provider: 'apple', providerId: `apple-${email}`, email })),
}));

type Handler = (request: Request, context: typeof noParams) => Promise<Response>;

async function call(handler: Handler, body: unknown) {
  const response = await handler(request('POST', '/api/v1/auth', { body }), noParams);
  return {
    status: response.status,
    headers: response.headers,
    body: response.status === 204 ? null : await response.json(),
  };
}

const EMAIL = 'asha@example.com';
const PASSWORD = 'mangoes and chapati';

const startSignUp = (overrides: Record<string, string> = {}) =>
  call(signUp, { name: 'Asha Otieno', email: EMAIL, password: PASSWORD, ...overrides });

// Lets the next code be sent at once, instead of waiting a minute.
const skipResendWait = () => EmailCode.updateMany({}, { $set: { sentAt: new Date(0) } });

async function signUpAndVerify() {
  await startSignUp();
  return call(verify, { email: EMAIL, code: lastCodeSentTo(EMAIL) });
}

beforeEach(resetDatabase);

describe('email sign-up', () => {
  it('emails a code and creates no account until it comes back', async () => {
    const { status, body } = await startSignUp({ email: '  Asha@Example.com ' });

    expect(status).toBe(202);
    expect(body.data).toEqual({ email: EMAIL, expiresInSeconds: 600, resendAfterSeconds: 60 });
    expect(lastCodeSentTo(EMAIL)).toMatch(/^\d{6}$/);
    expect(await User.countDocuments()).toBe(0);
    const stored = await EmailCode.findOne().lean();
    expect(JSON.stringify(stored)).not.toContain(lastCodeSentTo(EMAIL));
    expect(JSON.stringify(stored)).not.toContain(PASSWORD);
  });

  it('creates the account with the right code, signs in and sends a welcome email', async () => {
    const { status, body } = await signUpAndVerify();

    expect(status).toBe(200);
    expect(body.data.accessToken).toEqual(expect.any(String));
    expect(body.data.user).toMatchObject({ name: 'Asha Otieno', email: EMAIL, signInMethods: ['email'] });
    await vi.waitFor(() => expect(sentEmails.map((sent) => sent.subject)).toContain('Welcome to HauteCorner'));
  });

  it('accepts a code only once', async () => {
    await startSignUp();
    const code = lastCodeSentTo(EMAIL);
    await call(verify, { email: EMAIL, code });

    const again = await call(verify, { email: EMAIL, code });

    expect(again.status).toBe(400);
    expect(again.body.error.code).toBe('invalid_code');
  });

  it('counts wrong codes, and stops accepting any after five', async () => {
    await startSignUp();
    const code = lastCodeSentTo(EMAIL)!;
    const wrong = code === '000000' ? '111111' : '000000';

    const first = await call(verify, { email: EMAIL, code: wrong });
    expect(first.body.error.message).toBe('That code is not right. 4 tries left');
    for (let attempt = 0; attempt < 4; attempt++) await call(verify, { email: EMAIL, code: wrong });

    const right = await call(verify, { email: EMAIL, code });
    expect(right.status).toBe(400);
    expect(await User.countDocuments()).toBe(0);
  });

  it('refuses an expired code', async () => {
    await startSignUp();
    await EmailCode.updateMany({}, { $set: { codeExpiresAt: new Date(Date.now() - 1000) } });

    const { status, body } = await call(verify, { email: EMAIL, code: lastCodeSentTo(EMAIL) });

    expect(status).toBe(400);
    expect(body.error.message).toBe('This code has expired. Ask for a new one');
  });

  it('waits a minute between codes, and a new code replaces the old one', async () => {
    await startSignUp();
    const oldCode = lastCodeSentTo(EMAIL);

    const tooSoon = await call(resend, { email: EMAIL, purpose: 'signup' });
    expect(tooSoon.status).toBe(429);
    expect(Number(tooSoon.headers.get('Retry-After'))).toBeGreaterThan(0);

    await skipResendWait();
    expect((await call(resend, { email: EMAIL, purpose: 'signup' })).status).toBe(202);
    const newCode = lastCodeSentTo(EMAIL);
    if (newCode !== oldCode) expect((await call(verify, { email: EMAIL, code: oldCode })).status).toBe(400);
    expect((await call(verify, { email: EMAIL, code: newCode })).status).toBe(200);
  });

  it('refuses an address that already has a password', async () => {
    await signUpAndVerify();

    const { status, body } = await startSignUp();

    expect(status).toBe(409);
    expect(body.error.code).toBe('account_exists');
  });

  it.each([
    ['a short password', { password: 'short' }, 'password'],
    ['an invalid email', { email: 'not-an-email' }, 'email'],
    ['a missing name', { name: ' ' }, 'name'],
  ])('refuses %s', async (_case, overrides, field) => {
    const { status, body } = await startSignUp(overrides);

    expect(status).toBe(400);
    expect(body.error.details).toHaveProperty([field]);
    expect(sentEmails).toHaveLength(0);
  });
});

describe('email sign-in', () => {
  it('signs in with the right password', async () => {
    await signUpAndVerify();

    const { status, body } = await call(passwordSignIn, { email: 'ASHA@example.com', password: PASSWORD });

    expect(status).toBe(200);
    expect(body.data.user.email).toBe(EMAIL);
  });

  it('gives the same answer for a wrong password and an unknown address', async () => {
    await signUpAndVerify();

    const wrongPassword = await call(passwordSignIn, { email: EMAIL, password: 'not my password' });
    const unknown = await call(passwordSignIn, { email: 'nobody@example.com', password: PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknown.body);
  });

  it('limits attempts on one address', async () => {
    await signUpAndVerify();
    for (let attempt = 0; attempt < 10; attempt++) await call(passwordSignIn, { email: EMAIL, password: 'guess' });

    const { status, headers } = await call(passwordSignIn, { email: EMAIL, password: PASSWORD });

    expect(status).toBe(429);
    expect(headers.get('Retry-After')).toEqual(expect.any(String));
  });
});

describe('password reset', () => {
  it('answers the same for an unknown address, and sends nothing', async () => {
    const { status, body } = await call(forgot, { email: 'nobody@example.com' });

    expect(status).toBe(202);
    expect(body.data.email).toBe('nobody@example.com');
    expect(sentEmails).toHaveLength(0);
  });

  it('sets a new password, ends other sessions and sends a notice', async () => {
    const { body: signedUp } = await signUpAndVerify();
    sentEmails.length = 0;

    await call(forgot, { email: EMAIL });
    const code = lastCodeSentTo(EMAIL);
    const { status, body } = await call(reset, { email: EMAIL, code, password: 'a brand new passphrase' });

    expect(status).toBe(200);
    expect(body.data.refreshToken).toEqual(expect.any(String));
    expect((await call(refresh, { refreshToken: signedUp.data.refreshToken })).status).toBe(401);
    expect((await call(passwordSignIn, { email: EMAIL, password: PASSWORD })).status).toBe(401);
    expect((await call(passwordSignIn, { email: EMAIL, password: 'a brand new passphrase' })).status).toBe(200);
    await vi.waitFor(() =>
      expect(sentEmails.map((sent) => sent.subject)).toContain('Your HauteCorner password was changed'),
    );
  });

  it('does not send a second code within a minute, and answers the same', async () => {
    await signUpAndVerify();
    sentEmails.length = 0;

    await call(forgot, { email: EMAIL });
    const again = await call(forgot, { email: EMAIL });

    expect(again.status).toBe(202);
    expect(sentEmails).toHaveLength(1);
  });

  it('limits code emails to one address', async () => {
    for (let attempt = 0; attempt < 5; attempt++) await call(forgot, { email: 'nobody@example.com' });

    expect((await call(forgot, { email: 'nobody@example.com' })).status).toBe(429);
  });
});

describe('linking accounts by verified email', () => {
  it('adds a password to an account made with Google, without a welcome email', async () => {
    const google = await call(googleSignIn, { idToken: EMAIL });
    sentEmails.length = 0;

    const { body } = await signUpAndVerify();

    expect(body.data.user.id).toBe(google.body.data.user.id);
    expect(body.data.user.signInMethods).toEqual(['google', 'email']);
    expect(body.data.user.name).toBe('Google Name');
    expect(sentEmails.map((sent) => sent.subject)).not.toContain('Welcome to HauteCorner');
    expect(await User.countDocuments()).toBe(1);
  });

  it('links Google and Apple to an account made with email', async () => {
    const { body: email } = await signUpAndVerify();

    const google = await call(googleSignIn, { idToken: EMAIL });
    const apple = await call(appleSignIn, { identityToken: EMAIL });

    expect(google.body.data.user.id).toBe(email.data.user.id);
    expect(apple.body.data.user.id).toBe(email.data.user.id);
    expect(apple.body.data.user.signInMethods).toEqual(['google', 'apple', 'email']);
    expect(apple.body.data.user.name).toBe('Asha Otieno');
  });

  it('keeps an Apple private relay address separate', async () => {
    const { body: email } = await signUpAndVerify();

    const apple = await call(appleSignIn, { identityToken: 'x1y2@privaterelay.appleid.com' });

    expect(apple.body.data.user.id).not.toBe(email.data.user.id);
  });
});

describe('password hashing', () => {
  it('uses a new salt each time and checks passwords', async () => {
    const [first, second] = await Promise.all([hashPassword(PASSWORD), hashPassword(PASSWORD)]);

    expect(first).toMatch(/^scrypt\$32768\$8\$3\$/);
    expect(first).not.toBe(second);
    expect(await verifyPassword(PASSWORD, first)).toBe(true);
    expect(await verifyPassword('wrong', first)).toBe(false);
    expect(await verifyPassword(PASSWORD, 'not-a-hash')).toBe(false);
  });
});
