import { createHash } from 'node:crypto';
import { SignJWT } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as appleSignIn } from '@/app/api/v1/auth/apple/route';
import { POST as googleSignIn } from '@/app/api/v1/auth/google/route';
import { POST as logout } from '@/app/api/v1/auth/logout/route';
import { POST as refresh } from '@/app/api/v1/auth/refresh/route';
import { DELETE as deleteMe, GET as getMe, PATCH as patchMe } from '@/app/api/v1/me/route';
import { Session } from '@/models/Session';
import { User } from '@/models/User';
import { createSeller, noParams, request, resetDatabase } from './helpers';

// Provider tokens are checked in identity.test.ts. Here, the token text decides who signs in.
vi.mock('@/lib/identity', async () => {
  const { ApiError } = await import('@/lib/http');
  return {
    verifyGoogleIdToken: vi.fn(async (token: string) => {
      if (token === 'invalid') throw new ApiError(401, 'unauthenticated', 'Google sign-in could not be verified');
      return {
        provider: 'google',
        providerId: `google-${token}`,
        email: `${token}@example.com`,
        name: 'Asha Otieno',
        avatarUrl: 'https://lh3.googleusercontent.com/a/photo',
      };
    }),
    verifyAppleIdentityToken: vi.fn(async (token: string) => ({
      provider: 'apple',
      providerId: `apple-${token}`,
      email: 'abc123@privaterelay.appleid.com',
    })),
  };
});

type Handler = (request: Request, context: typeof noParams) => Promise<Response>;

async function call(handler: Handler, req: Request) {
  const response = await handler(req, noParams);
  const body = response.status === 204 ? null : await response.json();
  return { status: response.status, body };
}

const signInWithGoogle = (idToken = 'asha') =>
  call(googleSignIn, request('POST', '/api/v1/auth/google', { body: { idToken } }));
const signInWithApple = (identityToken: string, fullName?: unknown) =>
  call(appleSignIn, request('POST', '/api/v1/auth/apple', { body: { identityToken, fullName } }));
const refreshWith = (refreshToken: string) =>
  call(refresh, request('POST', '/api/v1/auth/refresh', { body: { refreshToken } }));
const logoutWith = (refreshToken: string) =>
  call(logout, request('POST', '/api/v1/auth/logout', { body: { refreshToken } }));
const fetchMe = (token?: string) => call(getMe, request('GET', '/api/v1/me', { token }));
const updateMe = (token: string, body: unknown) => call(patchMe, request('PATCH', '/api/v1/me', { token, body }));
const removeMe = (token: string) => call(deleteMe, request('DELETE', '/api/v1/me', { token }));

async function signedIn(idToken = 'asha') {
  const { body } = await signInWithGoogle(idToken);
  return body.data as { accessToken: string; refreshToken: string; user: { id: string } };
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

beforeEach(resetDatabase);

describe('POST /auth/google', () => {
  it('creates an account and a session, storing only a hash of the refresh token', async () => {
    const { status, body } = await signInWithGoogle();

    expect(status).toBe(200);
    expect(body.data.accessToken).toEqual(expect.any(String));
    expect(body.data.refreshToken).toEqual(expect.any(String));
    expect(body.data.user).toEqual({
      id: expect.any(String),
      name: 'Asha Otieno',
      email: 'asha@example.com',
      avatarUrl: 'https://lh3.googleusercontent.com/a/photo',
      phone: null,
      deliveryAddress: null,
      role: 'customer',
      seller: null,
    });

    const session = await Session.findOne().lean();
    expect(session!.tokenHash).toBe(createHash('sha256').update(body.data.refreshToken).digest('hex'));
    expect(JSON.stringify(session)).not.toContain(body.data.refreshToken);
  });

  it('signs the same person in to the same account, with a session per device', async () => {
    const first = await signedIn();
    const second = await signedIn();

    expect(second.user.id).toBe(first.user.id);
    expect(await User.countDocuments()).toBe(1);
    expect(await Session.countDocuments()).toBe(2);
  });

  it('keeps a name the user changed in the app', async () => {
    const { accessToken } = await signedIn();
    await updateMe(accessToken, { name: 'Asha O.' });

    const again = await signedIn();

    expect(again.user).toMatchObject({ name: 'Asha O.' });
  });

  it('includes the seller status', async () => {
    const { user } = await signedIn();
    const seller = await createSeller({ userId: user.id as never, status: 'applied' });

    const again = await signedIn();

    expect(again.user).toMatchObject({ seller: { id: String(seller._id), status: 'applied' } });
  });

  it('refuses a token that fails verification', async () => {
    const { status, body } = await signInWithGoogle('invalid');

    expect(status).toBe(401);
    expect(body.error.code).toBe('unauthenticated');
    expect(await User.countDocuments()).toBe(0);
  });

  it('refuses a missing token or a body that is not JSON', async () => {
    const missing = await call(googleSignIn, request('POST', '/api/v1/auth/google', { body: {} }));
    const notJson = await call(googleSignIn, request('POST', '/api/v1/auth/google', { body: 'idToken=abc' }));

    expect(missing.status).toBe(400);
    expect(missing.body.error.details).toHaveProperty('idToken');
    expect(notJson.status).toBe(400);
  });
});

describe('POST /auth/apple', () => {
  it('saves the name Apple sends on the first sign-in', async () => {
    const { status, body } = await signInWithApple('wanjiru', { givenName: 'Wanjiru', familyName: 'Kamau' });

    expect(status).toBe(200);
    expect(body.data.user).toMatchObject({ name: 'Wanjiru Kamau', email: 'abc123@privaterelay.appleid.com' });
  });

  it('does not replace the name on later sign-ins', async () => {
    await signInWithApple('wanjiru', { givenName: 'Wanjiru', familyName: 'Kamau' });

    const { body } = await signInWithApple('wanjiru', { givenName: 'Someone', familyName: null });

    expect(body.data.user.name).toBe('Wanjiru Kamau');
  });

  it('leaves the name empty when Apple sends none', async () => {
    const { body } = await signInWithApple('private', null);

    expect(body.data.user.name).toBeNull();
  });
});

describe('POST /auth/refresh', () => {
  it('returns a new pair, and the new access token works', async () => {
    const { refreshToken } = await signedIn();

    const { status, body } = await refreshWith(refreshToken);

    expect(status).toBe(200);
    expect(body.data.refreshToken).not.toBe(refreshToken);
    expect((await fetchMe(body.data.accessToken)).status).toBe(200);
  });

  it('ends the session when a replaced token is used again', async () => {
    const { refreshToken: first } = await signedIn();
    const { body } = await refreshWith(first);
    const second = body.data.refreshToken;

    const reused = await refreshWith(first);

    expect(reused.status).toBe(401);
    expect((await refreshWith(second)).status).toBe(401);
    expect((await Session.findOne().lean())!.revokedAt).toBeInstanceOf(Date);
  });

  it('leaves other devices signed in when one session ends', async () => {
    const phone = await signedIn();
    const tablet = await signedIn();
    await refreshWith(phone.refreshToken);
    await refreshWith(phone.refreshToken);

    expect((await refreshWith(tablet.refreshToken)).status).toBe(200);
  });

  it('refuses an unknown or expired token', async () => {
    const { refreshToken } = await signedIn();
    await Session.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });

    expect((await refreshWith('not-a-real-token')).status).toBe(401);
    expect((await refreshWith(refreshToken)).status).toBe(401);
  });

  it('ends the session of a deleted account', async () => {
    const { refreshToken } = await signedIn();
    await User.updateMany({}, { $set: { deletedAt: new Date() } });

    expect((await refreshWith(refreshToken)).status).toBe(401);
    expect((await Session.findOne().lean())!.revokedAt).toBeInstanceOf(Date);
  });
});

describe('POST /auth/logout', () => {
  it('ends the session', async () => {
    const { refreshToken } = await signedIn();

    const { status } = await logoutWith(refreshToken);

    expect(status).toBe(204);
    expect((await refreshWith(refreshToken)).status).toBe(401);
  });

  it('succeeds for an unknown token', async () => {
    expect((await logoutWith('not-a-real-token')).status).toBe(204);
  });
});

describe('access tokens', () => {
  const token = (claims: { sub: string; exp?: number }, key = secret) => {
    const jwt = new SignJWT({ role: 'customer' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(claims.sub)
      .setIssuer('hautecorner')
      .setAudience('hautecorner-app')
      .setIssuedAt();
    return jwt.setExpirationTime(claims.exp ?? '15m').sign(key);
  };

  it('are required', async () => {
    const { status, body } = await fetchMe();

    expect(status).toBe(401);
    expect(body.error.code).toBe('unauthenticated');
  });

  it('are refused when expired, malformed or signed with another key', async () => {
    const { user } = await signedIn();
    const expired = await token({ sub: user.id, exp: Math.floor(Date.now() / 1000) - 60 });
    const forged = await token({ sub: user.id }, new TextEncoder().encode('a-different-secret-of-at-least-32-chars'));

    expect((await fetchMe(expired)).status).toBe(401);
    expect((await fetchMe(forged)).status).toBe(401);
    expect((await fetchMe('not.a.jwt')).status).toBe(401);
  });

  it('are refused without a signature', async () => {
    const { user } = await signedIn();
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const unsigned = `${encode({ alg: 'none' })}.${encode({ sub: user.id, role: 'admin', iss: 'hautecorner', aud: 'hautecorner-app', exp: Math.floor(Date.now() / 1000) + 600 })}.`;

    expect((await fetchMe(unsigned)).status).toBe(401);
  });
});

describe('GET and PATCH /me', () => {
  it('updates the name, phone and delivery address', async () => {
    const { accessToken } = await signedIn();

    const { status, body } = await updateMe(accessToken, {
      name: 'Asha Otieno',
      phone: '0712 345 678',
      deliveryAddress: { line1: 'Ngong Road, Prestige Plaza', area: 'Kilimani', city: 'Nairobi', notes: '' },
    });

    expect(status).toBe(200);
    expect(body.data).toMatchObject({
      phone: '+254712345678',
      deliveryAddress: { line1: 'Ngong Road, Prestige Plaza', area: 'Kilimani', city: 'Nairobi', notes: null },
    });
    expect((await fetchMe(accessToken)).body.data).toEqual(body.data);
  });

  it.each(['+254 712 345 678', '254712345678', '712345678', '0112345678'])('accepts the phone number %s', async (phone) => {
    const { accessToken } = await signedIn();

    const { status } = await updateMe(accessToken, { phone });

    expect(status).toBe(200);
  });

  it('clears fields set to null', async () => {
    const { accessToken } = await signedIn();
    await updateMe(accessToken, { phone: '0712345678', deliveryAddress: { line1: 'Moi Avenue', city: 'Mombasa' } });

    const { body } = await updateMe(accessToken, { phone: null, deliveryAddress: null });

    expect(body.data).toMatchObject({ phone: null, deliveryAddress: null });
  });

  it.each([
    ['an invalid phone number', { phone: '0812345678' }, 'phone'],
    ['an address without a city', { deliveryAddress: { line1: 'Moi Avenue' } }, 'deliveryAddress.city'],
    ['a role change', { role: 'admin' }, 'body'],
    ['an empty change', {}, 'body'],
  ])('refuses %s', async (_case, change, field) => {
    const { accessToken } = await signedIn();

    const { status, body } = await updateMe(accessToken, change);

    expect(status).toBe(400);
    expect(body.error.details).toHaveProperty([field]);
    expect((await User.findOne().lean())!.role).toBe('customer');
  });
});

describe('DELETE /me', () => {
  it('removes personal details and every session', async () => {
    const phone = await signedIn();
    const tablet = await signedIn();
    await updateMe(phone.accessToken, { phone: '0712345678', deliveryAddress: { line1: 'Moi Avenue', city: 'Mombasa' } });

    const { status } = await removeMe(phone.accessToken);

    expect(status).toBe(204);
    const user = await User.findById(phone.user.id).lean();
    expect(user).toMatchObject({ provider: 'google', role: 'customer', wishlist: [], deletedAt: expect.any(Date) });
    expect(user!.providerId).toBe(`deleted:${phone.user.id}`);
    for (const field of ['email', 'name', 'avatarUrl', 'phone', 'deliveryAddress']) {
      expect(user).not.toHaveProperty(field);
    }
    expect(await Session.countDocuments()).toBe(0);
    expect((await refreshWith(tablet.refreshToken)).status).toBe(401);
    expect((await fetchMe(tablet.accessToken)).status).toBe(401);
  });

  it('creates a new, empty account if the person signs in again', async () => {
    const before = await signedIn();
    await removeMe(before.accessToken);

    const after = await signedIn();

    expect(after.user.id).not.toBe(before.user.id);
    expect(await User.countDocuments()).toBe(2);
  });
});
