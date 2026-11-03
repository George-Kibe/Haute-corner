import { z } from 'zod';
import { objectId } from '@/lib/validation';
import { WISHLIST_LIMIT } from '@/models/User';

export const mergeWishlistBody = z.object({
  productIds: z.array(objectId).max(WISHLIST_LIMIT),
});
