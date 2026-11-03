import { createLocalJWKSet, exportJWK, exportSPKI, generateKeyPair, SignJWT } from 'jose';
import { OAuth2Client } from 'google-auth-library';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/http';
import { verifyAppleIdentityToken, verifyGoogleIdToken } from '@/lib/identity';

type Keys = Awaited<ReturnType<typeof generateKeyPair>>;
let providerKeys: Keys;
let otherKeys: Keys;

beforeAll(async () => {
  providerKeys = await generateKeyPair('RS256', { extractable: true });
  otherKeys = await generateKeyPair('RS256', { extractable: true });
});

afterEach(() => vi.restoreAllMocks());

function sign(claims: Record<string, unknown>, { key = providerKeys.privateKey, expiresIn = '10m' } = {}) {
  return new SignJWT(claims).setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).setIssuedAt().setExpirationTime(expiresIn).sign(key);
}

async function expectStatus(promise: Promise<unknown>, status: number) {
  const error = await promise.catch((caught) => caught);
  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).status).toBe(status);
}

describe('verifyAppleIdentityToken', () => {
  const apple = { iss: 'https://appleid.apple.com', aud: 'com.hautecorner.app', sub: '001234.abcdef' };
  const keySet = async () =>
    createLocalJWKSet({ keys: [{ ...(await exportJWK(providerKeys.publicKey)), kid: 'test-key', alg: 'RS256' }] });

  it('accepts a token Apple issued for our bundle ID', async () => {
    const token = await sign({ ...apple, email: 'ABC@privaterelay.appleid.com', email_verified: 'true' });

    await expect(verifyAppleIdentityToken(token, await keySet())).resolves.toEqual({
      provider: 'apple',
      providerId: '001234.abcdef',
      email: 'abc@privaterelay.appleid.com',
    });
  });

  // A matching address links accounts, so an unverified one must not count.
  it('ignores an email address Apple has not verified', async () => {
    const token = await sign({ ...apple, email: 'someone@example.com', email_verified: false });

    const identity = await verifyAppleIdentityToken(token, await keySet());

    expect(identity.email).toBeUndefined();
  });

  it.each([
    ['for another app', { ...apple, aud: 'com.example.other' }],
    ['from another issuer', { ...apple, iss: 'https://example.com' }],
  ])('refuses a token %s', async (_case, claims) => {
    await expectStatus(verifyAppleIdentityToken(await sign(claims), await keySet()), 401);
  });

  it('refuses an expired token, or one signed with another key', async () => {
    const expired = await sign(apple, { expiresIn: '-1m' });
    const forged = await sign(apple, { key: otherKeys.privateKey });

    await expectStatus(verifyAppleIdentityToken(expired, await keySet()), 401);
    await expectStatus(verifyAppleIdentityToken(forged, await keySet()), 401);
  });
});

describe('verifyGoogleIdToken', () => {
  const google = {
    iss: 'https://accounts.google.com',
    aud: 'test-web-client.apps.googleusercontent.com',
    azp: 'android-client.apps.googleusercontent.com',
    sub: '1098765432',
    email: 'asha@gmail.com',
    email_verified: true,
    name: 'Asha Otieno',
    picture: 'https://lh3.googleusercontent.com/a/photo',
  };

  // Serve our test key as Google's signing certificate, with no network access.
  async function useTestCertificates() {
    const certs = { 'test-key': await exportSPKI(providerKeys.publicKey) };
    vi.spyOn(OAuth2Client.prototype, 'getFederatedSignonCertsAsync').mockResolvedValue({
      certs,
      format: 'PEM',
    } as never);
  }

  it('accepts a token issued for our web client', async () => {
    await useTestCertificates();

    await expect(verifyGoogleIdToken(await sign(google))).resolves.toEqual({
      provider: 'google',
      providerId: '1098765432',
      email: 'asha@gmail.com',
      name: 'Asha Otieno',
      avatarUrl: 'https://lh3.googleusercontent.com/a/photo',
    });
  });

  it('ignores an email address Google has not verified', async () => {
    await useTestCertificates();

    const identity = await verifyGoogleIdToken(await sign({ ...google, email_verified: false }));

    expect(identity.email).toBeUndefined();
  });

  it.each([
    ['for another app', { ...google, aud: 'someone-else.apps.googleusercontent.com' }],
    ['from another issuer', { ...google, iss: 'https://example.com' }],
  ])('refuses a token %s', async (_case, claims) => {
    await useTestCertificates();

    await expectStatus(verifyGoogleIdToken(await sign(claims)), 401);
  });

  it('refuses an expired token, or one signed with another key', async () => {
    await useTestCertificates();

    await expectStatus(verifyGoogleIdToken(await sign(google, { expiresIn: '-10m' })), 401);
    await expectStatus(verifyGoogleIdToken(await sign(google, { key: otherKeys.privateKey })), 401);
  });

  it('reports Google being unreachable as unavailable, not as a bad token', async () => {
    vi.spyOn(OAuth2Client.prototype, 'getFederatedSignonCertsAsync').mockRejectedValue(new Error('ECONNRESET'));

    await expectStatus(verifyGoogleIdToken(await sign(google)), 503);
  });
});
