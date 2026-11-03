import { createHash, randomBytes } from 'node:crypto';
import { jwtVerify, SignJWT } from 'jose';
import type { Types } from 'mongoose';
import { ApiError } from '@/lib/http';
import { isObjectId } from '@/lib/validation';
import { Session } from '@/models/Session';
import { User, USER_ROLES, type UserAttributes } from '@/models/User';

const ACCESS_TOKEN_LIFETIME = '15m';
const REFRESH_TOKEN_DAYS = 30;
const ISSUER = 'hautecorner';
const AUDIENCE = 'hautecorner-app';

type Role = UserAttributes['role'];
export type Caller = { userId: string; role: Role };

export const unauthenticated = (message = 'Sign in to continue') => new ApiError(401, 'unauthenticated', message);

function signingKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be set to at least 32 random characters');
  return new TextEncoder().encode(secret);
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const newRefreshToken = () => randomBytes(32).toString('base64url');
const refreshExpiry = () => new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

// Access tokens carry only the user ID and role.
export function issueAccessToken(user: { _id: Types.ObjectId; role: Role }) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user._id))
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_LIFETIME)
    .sign(signingKey());
}

// Starts a session for a user who has just signed in.
export async function createSession(user: { _id: Types.ObjectId; role: Role }) {
  const refreshToken = newRefreshToken();
  await Session.create({ userId: user._id, tokenHash: hashToken(refreshToken), expiresAt: refreshExpiry() });
  return { accessToken: await issueAccessToken(user), refreshToken };
}

// Swaps a refresh token for a new one, which stops the old one working. If the
// token that was just replaced comes back, two parties hold it, so the session
// is revoked. Clients must therefore never refresh twice in parallel.
export async function rotateSession(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const nextToken = newRefreshToken();
  const now = new Date();

  const session = await Session.findOneAndUpdate(
    { tokenHash, revokedAt: { $exists: false }, expiresAt: { $gt: now } },
    { $set: { tokenHash: hashToken(nextToken), previousTokenHash: tokenHash, expiresAt: refreshExpiry() } },
    { returnDocument: 'after' },
  ).lean();

  if (!session) {
    await Session.updateOne(
      { previousTokenHash: tokenHash, revokedAt: { $exists: false } },
      { $set: { revokedAt: now } },
    );
    throw unauthenticated('Your session has ended. Sign in again');
  }

  const user = await User.findOne({ _id: session.userId, deletedAt: { $exists: false } }).lean();
  if (!user) {
    await Session.updateOne({ _id: session._id }, { $set: { revokedAt: now } });
    throw unauthenticated('Your session has ended. Sign in again');
  }

  return { accessToken: await issueAccessToken(user), refreshToken: nextToken };
}

export async function revokeSession(refreshToken: string) {
  await Session.updateOne(
    { tokenHash: hashToken(refreshToken), revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  );
}

// Reads and checks the bearer token. It does not touch the database, so a
// deleted account keeps a valid access token until it expires. Use requireUser
// where that matters.
export async function authenticate(request: Request): Promise<Caller> {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) throw unauthenticated();

  const key = signingKey();
  try {
    const { payload } = await jwtVerify(token, key, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['HS256'],
    });
    const role = payload.role as Role;
    if (!payload.sub || !isObjectId(payload.sub) || !USER_ROLES.includes(role)) throw unauthenticated();
    return { userId: payload.sub, role };
  } catch {
    throw unauthenticated('Your session has expired');
  }
}

// Authenticates and loads the caller, refusing deleted accounts.
export async function requireUser(request: Request) {
  const { userId } = await authenticate(request);
  const user = await User.findOne({ _id: userId, deletedAt: { $exists: false } }).lean();
  if (!user) throw unauthenticated();
  return user;
}
