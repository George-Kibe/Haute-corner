import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import type { SessionTokens, SignInResult } from '@/features/auth/types';
import { apiRequest, ApiError } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';
import { storage } from '@/lib/storage';

const REFRESH_TOKEN_KEY = 'hautecorner.refreshToken';

export const meQueryKey = ['me'] as const;

type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

export const useSession = create<{ status: SessionStatus }>(() => ({ status: 'loading' }));

// The access token lives only in memory. The refresh token is kept in the
// Keychain on iOS and the Keystore on Android.
let accessToken: string | null = null;
let refreshing: Promise<string> | null = null;

const readRefreshToken = () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY).catch(() => null);

const INSTALLED_KEY = 'installed';

// Reading never throws, so this always settles on signed in or out.
export async function restoreSession() {
  // iOS keeps Keychain items after the app is deleted, but MMKV goes with it.
  // A fresh install therefore starts signed out, as people expect.
  if (!storage.getBoolean(INSTALLED_KEY)) {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => undefined);
    storage.set(INSTALLED_KEY, true);
  }
  const refreshToken = await readRefreshToken();
  useSession.setState({ status: refreshToken ? 'signedIn' : 'signedOut' });
}

export async function startSession({ accessToken: access, refreshToken, user }: SignInResult) {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  accessToken = access;
  queryClient.setQueryData(meQueryKey, user);
  useSession.setState({ status: 'signedIn' });
}

export async function endSession() {
  accessToken = null;
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => undefined);
  queryClient.removeQueries({ queryKey: meQueryKey });
  useSession.setState({ status: 'signedOut' });
}

// Revokes the session on the server where possible, then forgets it here.
export async function signOutSession() {
  const refreshToken = await readRefreshToken();
  if (refreshToken) {
    await apiRequest('/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => undefined);
  }
  await endSession();
}

// The server ends the session if a refresh token is used twice, so every
// caller waiting for a new access token shares one request.
function refreshAccessToken(): Promise<string> {
  refreshing ??= (async () => {
    try {
      const refreshToken = await readRefreshToken();
      if (!refreshToken) throw new ApiError(401, 'unauthenticated', 'Sign in to continue');

      const { data } = await apiRequest<SessionTokens>('/auth/refresh', { method: 'POST', body: { refreshToken } });
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
      accessToken = data.accessToken;
      return data.accessToken;
    } catch (error) {
      // A network failure keeps the session, so the request can be retried.
      if (error instanceof ApiError && error.status === 401) await endSession();
      throw error;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

type AuthRequestOptions = Omit<Parameters<typeof apiRequest>[1], 'accessToken'>;

// Calls the API as the signed-in user. An expired access token is refreshed
// once and the request retried.
export async function authRequest<T>(path: string, options: AuthRequestOptions = {}) {
  const token = accessToken ?? (await refreshAccessToken());
  try {
    return await apiRequest<T>(path, { ...options, accessToken: token });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
  }

  const freshToken = await refreshAccessToken();
  try {
    return await apiRequest<T>(path, { ...options, accessToken: freshToken });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) await endSession();
    throw error;
  }
}
