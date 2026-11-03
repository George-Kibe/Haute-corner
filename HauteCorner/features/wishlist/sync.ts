import { authRequest, useSession } from '@/features/auth/session';
import { addLike, removeLike, setLikedIds, useWishlist } from '@/features/wishlist/store';
import { ApiError } from '@/lib/api-client';

type WishlistIds = { productIds: string[] };

// Signing in adds the device's likes to the account. Opening the app signed
// in takes the account's list, so changes from other devices show. Signing
// out clears the device, and the likes stay in the account.
export function startWishlistSync() {
  return useSession.subscribe((state, previous) => {
    if (state.status === previous.status) return;

    if (state.status === 'signedOut' && previous.status === 'signedIn') {
      setLikedIds([]);
    } else if (state.status === 'signedIn' && previous.status === 'signedOut') {
      mergeDeviceLikes().catch(() => undefined);
    } else if (state.status === 'signedIn' && previous.status === 'loading') {
      refreshFromAccount().catch(() => undefined);
    }
  });
}

export async function mergeDeviceLikes() {
  const { productIds } = useWishlist.getState();
  const { data } = await authRequest<WishlistIds>('/me/wishlist', { method: 'POST', body: { productIds } });
  setLikedIds(data.productIds);
}

export async function refreshFromAccount() {
  const { data } = await authRequest<WishlistIds>('/me/wishlist');
  setLikedIds(data.productIds);
}

// Updates the device at once, then the account when signed in. If the
// account cannot be updated, the device goes back to how it was.
export async function toggleLike(productId: string) {
  const wasLiked = useWishlist.getState().productIds.includes(productId);
  if (wasLiked) removeLike(productId);
  else addLike(productId);

  if (useSession.getState().status !== 'signedIn') return !wasLiked;

  try {
    await authRequest(`/me/wishlist/${productId}`, { method: wasLiked ? 'DELETE' : 'PUT' });
  } catch (error) {
    // A product that is no longer for sale cannot be liked.
    if (error instanceof ApiError && error.status === 404 && !wasLiked) {
      removeLike(productId);
    } else if (wasLiked) {
      addLike(productId);
    } else {
      removeLike(productId);
    }
    throw error;
  }
  return !wasLiked;
}
