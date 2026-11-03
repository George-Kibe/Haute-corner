// Verifies Google and Apple sign-in tokens from the app.
import { OAuth2Client } from 'google-auth-library';
import { createRemoteJWKSet, errors, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { ApiError } from '@/lib/http';
import type { UserAttributes } from '@/models/User';

export type VerifiedIdentity = {
  provider: UserAttributes['provider'];
  providerId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
};

const rejected = (provider: string) => new ApiError(401, 'unauthenticated', `${provider} sign-in could not be verified`);
const unavailable = (provider: string) =>
  new ApiError(503, 'service_unavailable', `${provider} sign-in is not reachable. Try again shortly`);

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const google = new OAuth2Client();

// The app asks for an ID token for our web client, so that is the audience.
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedIdentity> {
  const audience = requiredEnv('GOOGLE_WEB_CLIENT_ID');

  // Fetch Google's keys first, so a network failure is not reported as a bad token.
  try {
    await google.getFederatedSignonCertsAsync();
  } catch {
    throw unavailable('Google');
  }

  let payload;
  try {
    payload = (await google.verifyIdToken({ idToken, audience })).getPayload();
  } catch {
    throw rejected('Google');
  }
  if (!payload?.sub) throw rejected('Google');

  return {
    provider: 'google',
    providerId: payload.sub,
    email: payload.email_verified ? payload.email : undefined,
    name: payload.name,
    avatarUrl: payload.picture,
  };
}

const appleKeys = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

// Apple tokens are for our bundle ID. Apple sends the name only to the app, and
// only the first time, so the route takes it from the request instead.
export async function verifyAppleIdentityToken(
  identityToken: string,
  keys: JWTVerifyGetKey = appleKeys,
): Promise<VerifiedIdentity> {
  const audience = requiredEnv('APPLE_BUNDLE_ID');

  let payload;
  try {
    ({ payload } = await jwtVerify(identityToken, keys, {
      issuer: 'https://appleid.apple.com',
      audience,
      algorithms: ['RS256'],
    }));
  } catch (error) {
    if (error instanceof errors.JOSEError && !(error instanceof errors.JWKSTimeout)) throw rejected('Apple');
    throw unavailable('Apple');
  }
  if (!payload.sub) throw rejected('Apple');

  return {
    provider: 'apple',
    providerId: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
  };
}
