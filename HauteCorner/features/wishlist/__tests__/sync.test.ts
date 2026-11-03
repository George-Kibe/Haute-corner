import { ApiError } from '@/lib/api-client';

// The session store is real, so status changes reach the sync. Requests are mocked.
const mockAuthRequest = jest.fn();
jest.mock('@/features/auth/session', () => {
  const { create } = jest.requireActual<typeof import('zustand')>('zustand');
  return {
    useSession: create<{ status: 'loading' | 'signedOut' | 'signedIn' }>(() => ({ status: 'loading' })),
    authRequest: (...args: unknown[]) => mockAuthRequest(...args),
  };
});

import { useSession } from '@/features/auth/session';
import { setLikedIds, useWishlist } from '@/features/wishlist/store';
import { startWishlistSync, toggleLike } from '@/features/wishlist/sync';

const likedIds = () => useWishlist.getState().productIds;
const setStatus = (status: 'loading' | 'signedOut' | 'signedIn') => useSession.setState({ status });
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

let stop: () => void;

beforeEach(() => {
  mockAuthRequest.mockReset();
  setStatus('loading');
  setLikedIds([]);
  stop = startWishlistSync();
});

afterEach(() => stop());

describe('likes while signed out', () => {
  it('stay on the device, newest first, with no requests', async () => {
    setStatus('signedOut');

    await toggleLike('a');
    await toggleLike('b');
    await toggleLike('a');
    await toggleLike('a');

    expect(likedIds()).toEqual(['a', 'b']);
    expect(mockAuthRequest).not.toHaveBeenCalled();
  });
});

describe('signing in and out', () => {
  it('adds the device likes to the account when signing in', async () => {
    setStatus('signedOut');
    await toggleLike('local');
    mockAuthRequest.mockResolvedValue({ data: { productIds: ['local', 'saved'] } });

    setStatus('signedIn');
    await settle();

    expect(mockAuthRequest).toHaveBeenCalledWith('/me/wishlist', { method: 'POST', body: { productIds: ['local'] } });
    expect(likedIds()).toEqual(['local', 'saved']);
  });

  it('takes the account list when the app opens signed in', async () => {
    setLikedIds(['stale']);
    mockAuthRequest.mockResolvedValue({ data: { productIds: ['fresh'] } });

    setStatus('signedIn');
    await settle();

    expect(mockAuthRequest).toHaveBeenCalledWith('/me/wishlist');
    expect(likedIds()).toEqual(['fresh']);
  });

  it('clears the device when signing out', () => {
    mockAuthRequest.mockResolvedValue({ data: { productIds: ['saved'] } });
    setStatus('signedIn');
    setLikedIds(['saved']);

    setStatus('signedOut');

    expect(likedIds()).toEqual([]);
  });
});

describe('likes while signed in', () => {
  beforeEach(async () => {
    mockAuthRequest.mockResolvedValue({ data: { productIds: [] } });
    setStatus('signedIn');
    await settle();
    mockAuthRequest.mockReset();
  });

  it('save to the account', async () => {
    mockAuthRequest.mockResolvedValue(null);

    await toggleLike('a');
    await toggleLike('a');

    expect(mockAuthRequest).toHaveBeenNthCalledWith(1, '/me/wishlist/a', { method: 'PUT' });
    expect(mockAuthRequest).toHaveBeenNthCalledWith(2, '/me/wishlist/a', { method: 'DELETE' });
  });

  it('go back to how they were if the account cannot be updated', async () => {
    setLikedIds(['kept']);
    mockAuthRequest.mockRejectedValue(new ApiError(0, 'network_error', 'Check your connection'));

    await expect(toggleLike('new')).rejects.toThrow('Check your connection');
    await expect(toggleLike('kept')).rejects.toThrow('Check your connection');

    expect(likedIds()).toEqual(['kept']);
  });
});
