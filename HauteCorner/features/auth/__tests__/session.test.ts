import type * as SessionModule from '@/features/auth/session';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    store,
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => void store.set(key, value)),
    deleteItemAsync: jest.fn(async (key: string) => void store.delete(key)),
  };
});

// A real query client keeps a cache timer running, which stops Jest exiting.
jest.mock('@/lib/query-client', () => ({
  queryClient: { setQueryData: jest.fn(), removeQueries: jest.fn() },
}));

const KEY = 'hautecorner.refreshToken';
const user = { id: 'u1', name: 'Asha', email: null, avatarUrl: null, phone: null, deliveryAddress: null, role: 'customer', seller: null };

let session: typeof SessionModule;
let secureStore: { store: Map<string, string> };

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

// Answers /auth/refresh with the given handler, and other paths with 401 unless
// they carry one of the accepted access tokens.
function mockApi(refresh: () => Response | Promise<Response>, acceptedTokens: string[] = []) {
  const fetchMock = jest.fn(async (url: string, init: RequestInit) => {
    if (url.endsWith('/auth/refresh')) return refresh();
    const auth = (init.headers as Record<string, string>).Authorization;
    if (acceptedTokens.some((token) => auth === `Bearer ${token}`)) return json(200, { data: user });
    return json(401, { error: { code: 'unauthenticated', message: 'Sign in to continue' } });
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

const refreshCalls = (fetchMock: jest.Mock) => fetchMock.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'));

beforeEach(() => {
  jest.resetModules();
  process.env.EXPO_PUBLIC_API_URL = 'https://example.test/api/v1';
  session = require('@/features/auth/session');
  secureStore = require('expo-secure-store');
  secureStore.store.set(KEY, 'refresh-1');
  session.useSession.setState({ status: 'signedIn' });
});

describe('authRequest', () => {
  it('shares one refresh between requests made at the same time', async () => {
    const fetchMock = mockApi(() => json(200, { data: { accessToken: 'access-2', refreshToken: 'refresh-2' } }), [
      'access-2',
    ]);

    await Promise.all([session.authRequest('/me'), session.authRequest('/me'), session.authRequest('/me')]);

    expect(refreshCalls(fetchMock)).toHaveLength(1);
    expect(secureStore.store.get(KEY)).toBe('refresh-2');
  });

  it('refreshes an expired access token once and retries the request', async () => {
    await session.startSession({ accessToken: 'expired', refreshToken: 'refresh-1', user: user as never });
    const fetchMock = mockApi(() => json(200, { data: { accessToken: 'access-2', refreshToken: 'refresh-2' } }), [
      'access-2',
    ]);

    const result = await session.authRequest('/me');

    expect(result.data).toEqual(user);
    expect(refreshCalls(fetchMock)).toHaveLength(1);
  });

  it('signs out when the server refuses the refresh token', async () => {
    mockApi(() => json(401, { error: { code: 'unauthenticated', message: 'Your session has ended' } }));

    await expect(session.authRequest('/me')).rejects.toMatchObject({ status: 401 });

    expect(session.useSession.getState().status).toBe('signedOut');
    expect(secureStore.store.has(KEY)).toBe(false);
  });

  it('stays signed in when the network fails', async () => {
    mockApi(() => {
      throw new TypeError('Network request failed');
    });

    await expect(session.authRequest('/me')).rejects.toMatchObject({ code: 'network_error' });

    expect(session.useSession.getState().status).toBe('signedIn');
    expect(secureStore.store.get(KEY)).toBe('refresh-1');
  });
});

describe('restoreSession', () => {
  it('starts signed out on a fresh install, even if the Keychain kept a token', async () => {
    const { storage } = require('@/lib/storage');
    storage.remove('installed');

    await session.restoreSession();

    expect(session.useSession.getState().status).toBe('signedOut');
    expect(secureStore.store.has(KEY)).toBe(false);
  });

  it('is signed in only when a refresh token is stored', async () => {
    require('@/lib/storage').storage.set('installed', true);
    await session.restoreSession();
    expect(session.useSession.getState().status).toBe('signedIn');

    secureStore.store.clear();
    await session.restoreSession();
    expect(session.useSession.getState().status).toBe('signedOut');
  });
});
