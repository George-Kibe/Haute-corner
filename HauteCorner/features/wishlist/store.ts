import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';

// The same limit as the server.
export const WISHLIST_LIMIT = 200;

type WishlistState = {
  // Liked product IDs, newest first.
  productIds: string[];
};

// Likes are kept on the device, so they work without an account. While
// signed in, the server's list is the source and this mirrors it.
export const useWishlist = create<WishlistState>()(
  persist(() => ({ productIds: [] as string[] }), {
    name: 'wishlist',
    storage: createJSONStorage(() => zustandStorage),
  }),
);

export const setLikedIds = (productIds: string[]) =>
  useWishlist.setState({ productIds: productIds.slice(0, WISHLIST_LIMIT) });

export const addLike = (productId: string) =>
  setLikedIds([productId, ...useWishlist.getState().productIds.filter((id) => id !== productId)]);

export const removeLike = (productId: string) =>
  setLikedIds(useWishlist.getState().productIds.filter((id) => id !== productId));

export const useIsLiked = (productId: string) =>
  useWishlist((state) => state.productIds.includes(productId));
